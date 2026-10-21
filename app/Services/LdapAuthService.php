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

        // 1. Cek Akun Superadmin Darurat Lokal (Break-Glass Local Account)
        // Memungkinkan login darurat bagi SuperAdmin lokal tanpa bergantung ke server LDAP
        $localSuperAdmin = User::where('username', $username)->first();
        if ($localSuperAdmin && $localSuperAdmin->role === 'SuperAdmin' && !empty($localSuperAdmin->password) && Hash::check($password, $localSuperAdmin->password)) {
            if (!$localSuperAdmin->is_active) {
                throw new \DomainException('ACCOUNT_DISABLED');
            }
            return $localSuperAdmin;
        }

        // 2. Cek Mode Mock / Fallback Lokal
        if (config('services.ldap.mock', env('LDAP_MOCK', true))) {
            return $this->authenticateMock($username, $password);
        }

        // 2. Mode LDAP Real (LdapRecord Bind)
        try {
            /** @var Connection $connection */
            $connection = Container::getDefaultConnection();

            $baseDn = config('ldap.connections.default.base_dn', env('LDAP_BASE_DN', 'dc=yarsi,dc=ac,dc=id'));

            // 1. Cari user di seluruh Base DN tanpa batasan OU tertentu
            // Mendukung NIP / NPM via uid, sAMAccountName, atau cn
            $ldapUser = null;
            try {
                $ldapUser = $connection->query()
                    ->where('uid', '=', $username)
                    ->orWhere('sAMAccountName', '=', $username)
                    ->orWhere('cn', '=', $username)
                    ->first();
            } catch (\Throwable $searchException) {
                Log::warning("LDAP search warning: " . $searchException->getMessage());
            }

            // Tentukan user DN target untuk bind
            $targetDn = null;
            if ($ldapUser) {
                if (is_object($ldapUser) && method_exists($ldapUser, 'getDn')) {
                    $targetDn = $ldapUser->getDn();
                } elseif (is_array($ldapUser) && isset($ldapUser['dn'])) {
                    $targetDn = is_array($ldapUser['dn']) ? $ldapUser['dn'][0] : $ldapUser['dn'];
                }
            }

            if (!$targetDn) {
                // Fallback default DN jika search anonim dibatasi server
                $targetDn = "uid={$username},{$baseDn}";
            }

            // 2. Validasi kredensial password via LDAP bind
            if ($connection->auth()->attempt($targetDn, $password)) {
                // Jika pencarian awal belum dapat atribut, kueri ulang setelah bind berhasil
                if (!$ldapUser) {
                    try {
                        $ldapUser = $connection->query()
                            ->where('uid', '=', $username)
                            ->orWhere('sAMAccountName', '=', $username)
                            ->orWhere('cn', '=', $username)
                            ->first();
                    } catch (\Throwable $e) {}
                }

                $name = $ldapUser['displayname'][0] ?? $ldapUser['cn'][0] ?? $ldapUser['name'][0] ?? ucfirst($username);
                $email = $ldapUser['mail'][0] ?? $ldapUser['userprincipalname'][0] ?? "{$username}@yarsi.ac.id";
                $unitKerja = $ldapUser['department'][0] ?? $ldapUser['ou'][0] ?? $ldapUser['description'][0] ?? 'Universitas YARSI';

                // Cek akun lokal
                $existingUser = User::where('username', $username)->first();

                // Tolak login jika akun dinonaktifkan oleh Superadmin
                if ($existingUser && !$existingUser->is_active) {
                    Log::warning("Percobaan login ditolak: Akun username {$username} dinonaktifkan.");
                    throw new \DomainException('ACCOUNT_DISABLED');
                }

                // Pertahankan role jika sudah diatur di database lokal, default: 'User'
                $role = $existingUser ? $existingUser->role : 'User';
                $picServiceCode = $existingUser ? $existingUser->pic_service_code : null;

                // Auto-provisioning ke tabel users lokal
                $user = User::updateOrCreate(
                    ['username' => $username],
                    [
                        'name' => $name,
                        'email' => $email,
                        'unit_kerja' => $unitKerja,
                        'role' => $role,
                        'pic_service_code' => $picServiceCode,
                        'is_active' => true,
                        'guid' => $ldapUser['entryuuid'][0] ?? $ldapUser['objectguid'][0] ?? null,
                        'domain' => 'yarsi.ac.id',
                    ]
                );

                return $user;
            }

            Log::warning("LDAP Bind gagal untuk username: {$username}");
            return null;
        } catch (\DomainException $de) {
            throw $de;
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
            'sari' => [
                'name' => 'Sari Indah',
                'email' => 'sari.tu@kampus.ac.id',
                'unit_kerja' => 'Tata Usaha Fakultas Kedokteran',
                'role' => 'Tata Usaha',
            ],
            'budi' => [
                'name' => 'Dr. Budi Santoso',
                'email' => 'budi.approver@kampus.ac.id',
                'unit_kerja' => 'Pimpinan Lembaga',
                'role' => 'Approver',
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

        // Cek apakah akun lokal ada dan dinonaktifkan
        $existing = User::where('username', $lowerUsername)->orWhere('username', $username)->first();
        if ($existing && !$existing->is_active) {
            throw new \DomainException('ACCOUNT_DISABLED');
        }

        // Jika username adalah salah satu akun mock dan password benar
        if (isset($mockAccounts[$lowerUsername]) && $password === 'password') {
            $data = $mockAccounts[$lowerUsername];

            $role = $existing ? $existing->role : $data['role'];
            $picCode = $existing ? $existing->pic_service_code : ($data['pic_service_code'] ?? null);

            return User::updateOrCreate(
                ['username' => $lowerUsername],
                [
                    'name' => $existing ? $existing->name : $data['name'],
                    'email' => $existing ? $existing->email : $data['email'],
                    'unit_kerja' => $existing ? $existing->unit_kerja : $data['unit_kerja'],
                    'role' => $role,
                    'pic_service_code' => $picCode,
                    'is_active' => true,
                    'password' => Hash::make('password'),
                ]
            );
        }

        // Atau cek user yang ada di DB lokal
        $user = User::where('username', $username)->first();
        if ($user && Hash::check($password, $user->password)) {
            if (!$user->is_active) {
                throw new \DomainException('ACCOUNT_DISABLED');
            }
            return $user;
        }

        return null;
    }
}
