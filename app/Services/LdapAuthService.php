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
     * Akun Uji Coba Cepat sesuai Persona PRD
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
            'superadmin' => [
                'name' => 'Rini Andriani',
                'email' => 'rini.admin@kampus.ac.id',
                'unit_kerja' => 'Divisi Marketing YARSI',
                'role' => 'SuperAdmin',
            ],
            'ahmad' => [
                'name' => 'Ahmad Fauzi',
                'email' => 'ahmad.pic@kampus.ac.id',
                'unit_kerja' => 'Divisi Marketing YARSI',
                'role' => 'PIC',
                'pic_service_code' => 'D',
            ],
            'nurhaliza' => [
                'name' => 'Nurhaliza Putri',
                'email' => 'nurhaliza.pic@kampus.ac.id',
                'unit_kerja' => 'Divisi Marketing YARSI',
                'role' => 'PIC',
                'pic_service_code' => 'P',
            ],
            'bagas' => [
                'name' => 'Bagas Wicaksono',
                'email' => 'bagas.pic@kampus.ac.id',
                'unit_kerja' => 'Divisi Marketing YARSI',
                'role' => 'PIC',
                'pic_service_code' => 'S',
            ],
            'dewi' => [
                'name' => 'Dewi Rahayu',
                'email' => 'dewi.pic@kampus.ac.id',
                'unit_kerja' => 'Divisi Marketing YARSI',
                'role' => 'PIC',
                'pic_service_code' => 'M',
            ],
            'rizky' => [
                'name' => 'Rizky Pratama',
                'email' => 'rizky.pic@kampus.ac.id',
                'unit_kerja' => 'Divisi Marketing YARSI',
                'role' => 'PIC',
                'pic_service_code' => 'L',
            ],
            'fajar' => [
                'name' => 'Fajar Setiawan',
                'email' => 'fajar@kampus.ac.id',
                'unit_kerja' => 'Fakultas Kedokteran',
                'role' => 'User',
            ],
            'maya' => [
                'name' => 'Maya Anggraini',
                'email' => 'maya@kampus.ac.id',
                'unit_kerja' => 'Fakultas Teknologi Informasi',
                'role' => 'User',
            ],
            'hendra' => [
                'name' => 'Hendra Kurniawan',
                'email' => 'hendra@kampus.ac.id',
                'unit_kerja' => 'Fakultas Hukum',
                'role' => 'User',
            ],
            'sinta' => [
                'name' => 'Sinta Permata',
                'email' => 'sinta@kampus.ac.id',
                'unit_kerja' => 'Fakultas Ekonomi & Bisnis',
                'role' => 'User',
            ],
            'yusuf' => [
                'name' => 'Yusuf Ramadhan',
                'email' => 'yusuf@kampus.ac.id',
                'unit_kerja' => 'Biro Keuangan & SDM',
                'role' => 'User',
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
                    'pic_service_code' => $data['pic_service_code'] ?? null,
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
