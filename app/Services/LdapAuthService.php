<?php

namespace App\Services;

use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use LdapRecord\Connection;
use LdapRecord\Container;

class LdapAuthService
{
    /**
     * Otentikasi pengguna menggunakan LDAP Bind atau Fallback Mock untuk Dev/Staging
     */
    public function authenticate(string $username, string $password): ?User
    {
        $username = trim($username);

        // 1. Cek Mode Mock / Fallback Lokal
        if (config('services.ldap.mock', env('LDAP_MOCK', true))) {
            return $this->authenticateMock($username, $password);
        }

        // 2. Mode LDAP Real (LdapRecord Bind)
        try {
            /** @var Connection $connection */
            $connection = Container::getDefaultConnection();

            // Format DN atau UPN user
            $baseDn = config('ldap.connections.default.base_dn', 'dc=local,dc=com');
            $userDn = "uid={$username},{$baseDn}";

            // Mencoba bind kredensial
            if ($connection->auth()->attempt($userDn, $password)) {
                // Cari data pengguna di LDAP
                $ldapUser = $connection->query()->where('uid', '=', $username)->first();

                $name = $ldapUser['cn'][0] ?? ucfirst($username);
                $email = $ldapUser['mail'][0] ?? "{$username}@kampus.ac.id";
                $unitKerja = $ldapUser['department'][0] ?? 'Unit Kerja LDAP';

                // Tentukan role: cek apakah sudah diset manual di DB, default 'User'
                $existingUser = User::where('username', $username)->first();
                $role = $existingUser ? $existingUser->role : 'User';

                // Sinkronisasi ke DB lokal tanpa menyimpan password LDAP (NFR-SEC-02)
                $user = User::updateOrCreate(
                    ['username' => $username],
                    [
                        'name' => $name,
                        'email' => $email,
                        'unit_kerja' => $unitKerja,
                        'role' => $role,
                        'guid' => $ldapUser['entryuuid'][0] ?? null,
                        'domain' => 'ldap.local',
                    ]
                );

                return $user;
            }

            Log::warning("LDAP Bind gagal untuk username: {$username}");
            return null;
        } catch (Exception $e) {
            Log::error("Koneksi LDAP Server Error: " . $e->getMessage());
            // Fallback ke mock jika LDAP server tidak responsif (NFR-REL-01)
            return $this->authenticateMock($username, $password);
        }
    }

    /**
     * Akun Uji Coba Cepat (Andi, Sari, Pak Budi) sesuai Persona PRD Bab 5
     */
    protected function authenticateMock(string $username, string $password): ?User
    {
        $mockAccounts = [
            'andi' => [
                'name' => 'Andi Saputra',
                'email' => 'andi@kampus.ac.id',
                'unit_kerja' => 'Biro Akademik & Kemahasiswaan',
                'role' => 'User',
            ],
            'sari' => [
                'name' => 'Sari Wulandari',
                'email' => 'sari.humas@kampus.ac.id',
                'unit_kerja' => 'Universitas YARSI',
                'role' => 'Admin',
            ],
            'budi' => [
                'name' => 'Dr. Budi Santoso, M.Kom',
                'email' => 'budi.humas@kampus.ac.id',
                'unit_kerja' => 'Universitas YARSI',
                'role' => 'Approver',
            ],
        ];

        $lowerUsername = strtolower($username);

        // Jika username adalah salah satu akun mock dan password benar
        if (isset($mockAccounts[$lowerUsername]) && $password === 'password') {
            $data = $mockAccounts[$lowerUsername];

            return User::updateOrCreate(
                ['username' => $lowerUsername],
                [
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'unit_kerja' => $data['unit_kerja'],
                    'role' => $data['role'],
                    'password' => Hash::make('password'),
                ]
            );
        }

        // Atau cek user yang ada di DB lokal
        $user = User::where('username', $username)->first();
        if ($user && Hash::check($password, $user->password)) {
            return $user;
        }

        return null;
    }
}
