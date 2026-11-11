<?php

namespace Database\Seeders;

use App\Enums\ApplicationStatus;
use App\Enums\CompetitionCategory;
use App\Enums\CompetitionScope;
use App\Enums\CompetitionStatus;
use App\Enums\RecruitmentStatus;
use App\Enums\TeamPermission;
use App\Enums\TeamStatus;
use App\Enums\TeamType;
use App\Enums\VerificationStatus;
use App\Models\Competition;
use App\Models\CompetitionParticipation;
use App\Models\CompetitionSource;
use App\Models\Recruitment;
use App\Models\RecruitmentRole;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RealCompetitionSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('is_platform_admin', true)->first()
            ?? User::first();

        $adminId = $admin?->id ?? 1;

        $competitions = [
            [
                'slug' => 'gemastik-xviii-2027',
                'name' => 'GEMASTIK XVIII — Pagelaran Mahasiswa Nasional Bidang TIK',
                'organizer' => 'Balai Pengembangan Talenta Indonesia (BPTI), Puspresnas & Kemdiktisaintek',
                'description' => 'Kompetisi TIK paling bergengsi tingkat nasional antar perguruan tinggi se-Indonesia. Mewadahi 11 divisi talenta digital: Pemrograman, Pengembangan Perangkat Lunak, Keamanan Siber, Data Mining, UI/UX Design, Animasi, Smart City, Karya Tulis Ilmiah TIK, Pengembangan Bisnis TIK, Piranti Cerdas IoT, dan Kecerdasan Artifisial.',
                'category' => CompetitionCategory::Technology->value,
                'category_tracks' => [
                    'Pemrograman (Competitive Programming)',
                    'Pengembangan Perangkat Lunak (Software Development)',
                    'Keamanan Siber (Cyber Security)',
                    'Penambangan Data (Data Mining)',
                    'Desain Pengalaman Pengguna (UX Design)',
                    'Animasi (Animation)',
                    'Kota Cerdas (Smart City)',
                    'Karya Tulis Ilmiah TIK',
                    'Pengembangan Bisnis TIK',
                    'Piranti Cerdas (IoT & Embedded)',
                    'Kecerdasan Artifisial (AI)',
                ],
                'level' => 'national',
                'competition_type' => 'team',
                'official_url' => 'https://pusatprestasinasional.kemdikbud.go.id',
                'registration_url' => 'https://gemastik.kemdikbud.go.id',
                'registration_opens_at' => Carbon::parse('2026-11-01 08:00:00'),
                'registration_deadline' => Carbon::parse('2027-05-15 23:59:59'),
                'starts_at' => Carbon::parse('2027-06-01 08:00:00'),
                'ends_at' => Carbon::parse('2027-08-30 17:00:00'),
                'eligibility' => 'Mahasiswa aktif Diploma (D3/D4) dan Sarjana (S1) seluruh perguruan tinggi di Indonesia yang terdaftar di PDDIKTI dan belum lulus saat babak final.',
                'min_team_size' => 3,
                'max_team_size' => 3,
                'prize_info' => 'Piala Bergilir Samakya Vidya Nugraha + Medali Emas, Perak, Perunggu Puspresnas + Dana Pembinaan Total Rp 150.000.000 + Sertifikat Prestasi Nasional',
                'cover_image' => '/images/competitions/gemastik-ai.svg',
                'source_label' => 'Buku Panduan Resmi GEMASTIK BPTI Puspresnas',
                'source_url' => 'https://pusatprestasinasional.kemdikbud.go.id/panduan-gemastik',
            ],
            [
                'slug' => 'pkm-pimnas-2027',
                'name' => 'Program Kreativitas Mahasiswa (PKM) 2027 & Menuju PIMNAS 40',
                'organizer' => 'Direktorat Pembelajaran & Kemahasiswaan (Belmawa) Ditjen Diktiristek',
                'description' => 'Program unggulan Ditjen Diktiristek untuk menumbuhkan, mewadahi, dan mewujudkan ide kreatif serta inovatif mahasiswa. Meliputi 8 bidang pendanaan dan 2 bidang insentif untuk bermuara di Pekan Ilmiah Mahasiswa Nasional (PIMNAS).',
                'category' => CompetitionCategory::Research->value,
                'category_tracks' => [
                    'PKM-RE (Riset Eksakta)',
                    'PKM-RSH (Riset Sosial Humaniora)',
                    'PKM-K (Kewirausahaan)',
                    'PKM-PM (Pengabdian Kepada Masyarakat)',
                    'PKM-PI (Penerapan Iptek)',
                    'PKM-KC (Karsa Cipta)',
                    'PKM-KI (Karya Inovatif)',
                    'PKM-VGK (Video Gagasan Konstruktif)',
                    'PKM-GFT (Gagasan Futuristik Tertulis)',
                ],
                'level' => 'national',
                'competition_type' => 'team',
                'official_url' => 'https://simbelmawa.kemdiktisaintek.go.id',
                'registration_url' => 'https://simbelmawa.kemdiktisaintek.go.id',
                'registration_opens_at' => Carbon::parse('2026-11-01 08:00:00'),
                'registration_deadline' => Carbon::parse('2027-03-31 23:59:59'),
                'starts_at' => Carbon::parse('2027-04-15 08:00:00'),
                'ends_at' => Carbon::parse('2027-11-10 17:00:00'),
                'eligibility' => 'Mahasiswa aktif program Diploma atau Sarjana seluruh perguruan tinggi di bawah naungan Kemdiktisaintek dan terdaftar aktif di PDDIKTI.',
                'min_team_size' => 3,
                'max_team_size' => 5,
                'prize_info' => 'Dana Hibah Pelaksanaan Rp 6.000.000 - Rp 10.000.000 per judul lolos pendanaan + Tiket Finalis PIMNAS + Piala Bergilir Adhikarta Kertawidya',
                'cover_image' => '/images/competitions/pkm-k.svg',
                'source_label' => 'Pedoman Umum PKM Ditjen Diktiristek Belmawa',
                'source_url' => 'https://simbelmawa.kemdiktisaintek.go.id/pedoman-pkm',
            ],
            [
                'slug' => 'lidm-2027',
                'name' => 'LIDM 2027 — Lomba Inovasi Digital Mahasiswa',
                'organizer' => 'Balai Pengembangan Talenta Indonesia (BPTI), Puspresnas',
                'description' => 'Kompetisi nasional pengembangan karya dan inovasi digital berwawasan pendidikan dan pembangunan berkelanjutan (SDGs). Mengembangkan kemampuan literasi digital mahasiswa melalui karya video, poster, teknologi pembelajaran, dan microlearning.',
                'category' => CompetitionCategory::UiUx->value,
                'category_tracks' => [
                    'Divisi 1: Inovasi Teknologi Digital Pendidikan',
                    'Divisi 2: Inovasi Materi Digital Pendidikan',
                    'Divisi 3: Video Digital Pendidikan',
                    'Divisi 4: Poster Digital Pendidikan',
                    'Divisi 5: Microlearning Digital',
                ],
                'level' => 'national',
                'competition_type' => 'team',
                'official_url' => 'https://pusatprestasinasional.kemdikbud.go.id',
                'registration_url' => 'https://lidm.kemdikbud.go.id',
                'registration_opens_at' => Carbon::parse('2026-11-01 08:00:00'),
                'registration_deadline' => Carbon::parse('2027-04-30 23:59:59'),
                'starts_at' => Carbon::parse('2027-05-15 08:00:00'),
                'ends_at' => Carbon::parse('2027-07-25 17:00:00'),
                'eligibility' => 'Mahasiswa aktif Diploma (D3/D4) dan Sarjana (S1) perguruan tinggi se-Indonesia.',
                'min_team_size' => 3,
                'max_team_size' => 4,
                'prize_info' => 'Medali Emas/Perak/Perunggu Puspresnas + Sertifikat Tingkat Nasional + Dana Pembinaan Prestasi',
                'cover_image' => '/images/competitions/uiux-sprint.svg',
                'source_label' => 'Buku Panduan LIDM Puspresnas',
                'source_url' => 'https://pusatprestasinasional.kemdikbud.go.id/pedoman-lidm',
            ],
            [
                'slug' => 'satria-data-2027',
                'name' => 'SATRIA DATA 2027 — Statistika Ria & Festival Sains Data',
                'organizer' => 'Pusat Prestasi Nasional (Puspresnas) & Kemdiktisaintek',
                'description' => 'Ajang kompetisi nasional unjuk kebolehan mahasiswa dalam statistika terapan, analitika data komputasi, dan kecerdasan artifisial untuk perumusan kebijakan dan solusi industri.',
                'category' => CompetitionCategory::Programming->value,
                'category_tracks' => [
                    'Big Data Challenge (BDC)',
                    'National Statistics Competition (NSC)',
                    'Statistics Essay Competition (SEC)',
                    'Statistics Infographic Competition (SIC)',
                ],
                'level' => 'national',
                'competition_type' => 'team',
                'official_url' => 'https://satriadata.kemdikbud.go.id',
                'registration_url' => 'https://satriadata.kemdikbud.go.id',
                'registration_opens_at' => Carbon::parse('2026-11-01 08:00:00'),
                'registration_deadline' => Carbon::parse('2027-05-25 23:59:59'),
                'starts_at' => Carbon::parse('2027-06-10 08:00:00'),
                'ends_at' => Carbon::parse('2027-08-15 17:00:00'),
                'eligibility' => 'Mahasiswa aktif S1/D4/D3 seluruh perguruan tinggi di Indonesia terdaftar di PDDIKTI.',
                'min_team_size' => 2,
                'max_team_size' => 3,
                'prize_info' => 'Piala Bergilir Satria Data + Medali Puspresnas + Uang Pembinaan & Sertifikat Juara Nasional',
                'cover_image' => '/images/competitions/gemastik-ai.svg',
                'source_label' => 'Buku Panduan Satria Data Puspresnas',
                'source_url' => 'https://satriadata.kemdikbud.go.id/pedoman',
            ],
            [
                'slug' => 'kri-kontes-robot-indonesia-2027',
                'name' => 'Kontes Robot Indonesia (KRI) 2027',
                'organizer' => 'Balai Pengembangan Talenta Indonesia (BPTI), Puspresnas',
                'description' => 'Kompetisi rekayasa robotika terbesar di Indonesia yang mempertemukan inovator robot otonom, sistem kendali cerdas, dan mekanik dari berbagai universitas dan politeknik di tanah air.',
                'category' => CompetitionCategory::Technology->value,
                'category_tracks' => [
                    'KRAI (Kontes Robot ABU Indonesia)',
                    'KRSRI (Robot SAR Indonesia)',
                    'KRSBI-Beroda (Robot Sepak Bola Beroda)',
                    'KRSBI-Humanoid (Robot Sepak Bola Humanoid)',
                    'KRSTI (Robot Seni Tari)',
                    'KRBAI (Robot Bawah Air)',
                ],
                'level' => 'national',
                'competition_type' => 'team',
                'official_url' => 'https://kontesrobotindonesia.id',
                'registration_url' => 'https://kontesrobotindonesia.id',
                'registration_opens_at' => Carbon::parse('2026-11-01 08:00:00'),
                'registration_deadline' => Carbon::parse('2027-04-10 23:59:59'),
                'starts_at' => Carbon::parse('2027-05-01 08:00:00'),
                'ends_at' => Carbon::parse('2027-07-10 17:00:00'),
                'eligibility' => 'Tim mahasiswa perguruan tinggi terakreditasi di Indonesia dengan bimbingan dosen pembimbing teknik.',
                'min_team_size' => 3,
                'max_team_size' => 6,
                'prize_info' => 'Piala Juara Umum KRI + Medali Puspresnas + Hak Mewakili Indonesia di ABU Robocon Internasional',
                'cover_image' => '/images/competitions/iot-challenge.svg',
                'source_label' => 'Buku Pedoman Resmi KRI BPTI',
                'source_url' => 'https://kontesrobotindonesia.id/panduan',
            ],
            [
                'slug' => 'microsoft-imagine-cup-2027',
                'name' => 'Microsoft Imagine Cup 2027 — Global Student Hackathon',
                'organizer' => 'Microsoft Corporation',
                'description' => 'Kompetisi teknologi mahasiswa global paling terkemuka dari Microsoft. Membina para founder muda untuk membangun produk startup berbasis Azure Cloud & OpenAI APIs guna menyelesaikan masalah dunia nyata.',
                'category' => CompetitionCategory::Hackathon->value,
                'category_tracks' => [
                    'Generative AI & Copilot Extensions',
                    'Earth & Climate Solutions',
                    'Health & Biotech',
                    'Education & Accessibility',
                ],
                'level' => 'international',
                'competition_type' => 'team',
                'official_url' => 'https://imaginecup.microsoft.com',
                'registration_url' => 'https://imaginecup.microsoft.com/register',
                'registration_opens_at' => Carbon::parse('2026-11-01 08:00:00'),
                'registration_deadline' => Carbon::parse('2027-02-28 23:59:59'),
                'starts_at' => Carbon::parse('2027-03-15 08:00:00'),
                'ends_at' => Carbon::parse('2027-05-30 17:00:00'),
                'eligibility' => 'Mahasiswa aktif usia 16+ tahun di seluruh dunia. Anggota tim 1-4 orang.',
                'min_team_size' => 1,
                'max_team_size' => 4,
                'prize_info' => '$100,000 USD Grand Prize + Sesi Mentorship Eksklusif bersama CEO Microsoft Satya Nadella + $50,000 Azure Credits di Microsoft for Startups',
                'cover_image' => '/images/competitions/hackathon-camp.svg',
                'source_label' => 'Official Microsoft Imagine Cup Rules & Guidelines',
                'source_url' => 'https://imaginecup.microsoft.com/rules',
            ],
            [
                'slug' => 'google-solution-challenge-2027',
                'name' => 'Google Solution Challenge 2027 (GDSC Global)',
                'organizer' => 'Google Developers & Google Developer Student Clubs',
                'description' => 'Tantangan global tahunan bagi mahasiswa untuk merancang dan membangun solusi yang menjawab 1 atau lebih dari 17 Tujuan Pembangunan Berkelanjutan (UN SDGs) menggunakan teknologi Google.',
                'category' => CompetitionCategory::Innovation->value,
                'category_tracks' => [
                    'Zero Hunger & Agriculture',
                    'Good Health & Well-being',
                    'Quality Education',
                    'Decent Work & Economic Growth',
                    'Climate Action & Clean Energy',
                ],
                'level' => 'international',
                'competition_type' => 'team',
                'official_url' => 'https://developers.google.com/community/gdsc-solution-challenge',
                'registration_url' => 'https://developers.google.com/community/gdsc-solution-challenge',
                'registration_opens_at' => Carbon::parse('2026-11-01 08:00:00'),
                'registration_deadline' => Carbon::parse('2027-03-15 23:59:59'),
                'starts_at' => Carbon::parse('2027-03-25 08:00:00'),
                'ends_at' => Carbon::parse('2027-06-20 17:00:00'),
                'eligibility' => 'Mahasiswa aktif perguruan tinggi seluruh dunia, minimal satu anggota tergabung dalam GDSC.',
                'min_team_size' => 1,
                'max_team_size' => 4,
                'prize_info' => '$12,000 USD per winning team member + Mentorship langsung dari Google Product Managers + Swag Eksklusif Google',
                'cover_image' => '/images/competitions/hackathon-camp.svg',
                'source_label' => 'Google Developers Solution Challenge Overview',
                'source_url' => 'https://developers.google.com/community/gdsc-solution-challenge',
            ],
            [
                'slug' => 'diplomat-success-challenge-2027',
                'name' => 'Diplomat Success Challenge (DSC) 2027',
                'organizer' => 'Wismilak Foundation',
                'description' => 'Komisi ekosistem wirausaha dan kompetisi ide bisnis mandiri terbesar di Indonesia. Menyalurkan hibah modal usaha tanpa bagi hasil dan pendampingan mentor bisnis nasional.',
                'category' => CompetitionCategory::Entrepreneurship->value,
                'category_tracks' => [
                    'Food & Beverage',
                    'Kriya & Fashion',
                    'Teknologi & Jasa Digital',
                    'Agrobisnis & Pangan Berkelanjutan',
                ],
                'level' => 'national',
                'competition_type' => 'individual',
                'official_url' => 'https://diplomatsukses.com',
                'registration_url' => 'https://diplomatsukses.com/register',
                'registration_opens_at' => Carbon::parse('2026-11-01 08:00:00'),
                'registration_deadline' => Carbon::parse('2027-07-20 23:59:59'),
                'starts_at' => Carbon::parse('2027-08-01 08:00:00'),
                'ends_at' => Carbon::parse('2027-11-30 17:00:00'),
                'eligibility' => 'Warga Negara Indonesia usia 20-45 tahun, mahasiswa tingkat akhir, fresh graduate, atau pemegang gagasan bisnis rintisan mandiri.',
                'min_team_size' => 1,
                'max_team_size' => 3,
                'prize_info' => 'Total Hibah Modal Usaha Rp 2.500.000.000 (Dua Koma Lima Miliar Rupiah) Bebas Bagi Hasil + Mentorship Eksekutif',
                'cover_image' => '/images/competitions/pkm-k.svg',
                'source_label' => 'Panduan Pendaftaran Resmi Diplomat Sukses',
                'source_url' => 'https://diplomatsukses.com/panduan',
            ],
            [
                'slug' => 'compfest-19-fasilkom-ui-2027',
                'name' => 'CompFest 19 — Fasilkom Universitas Indonesia',
                'organizer' => 'Fakultas Ilmu Komputer, Universitas Indonesia',
                'description' => 'Acara TI mahasiswa tahunan terbesar di Indonesia yang diselenggarakan oleh Fasilkom UI. Menghadirkan kompetisi bereputasi tinggi di bidang keamanan siber, pemrograman kompetitif, dan strategi IT bisnis.',
                'category' => CompetitionCategory::Programming->value,
                'category_tracks' => [
                    'Competitive Programming Contest (CPC)',
                    'Capture The Flag (CTF Security)',
                    'Business-IT Case',
                    'Indie Game Ignite (IGI)',
                ],
                'level' => 'national',
                'competition_type' => 'team',
                'official_url' => 'https://compfest.id',
                'registration_url' => 'https://compfest.id/competition',
                'registration_opens_at' => Carbon::parse('2026-11-01 08:00:00'),
                'registration_deadline' => Carbon::parse('2027-06-15 23:59:59'),
                'starts_at' => Carbon::parse('2027-07-01 08:00:00'),
                'ends_at' => Carbon::parse('2027-09-20 17:00:00'),
                'eligibility' => 'Mahasiswa aktif S1/Diploma seluruh Indonesia dan siswa SMA/SMK sederajat.',
                'min_team_size' => 1,
                'max_team_size' => 3,
                'prize_info' => 'Total Hadiah Rp 120.000.000 + Sertifikat Nasional Fasilkom UI + Jalur Khusus Fast-Track Wawancara Perusahaan Sponsor',
                'cover_image' => '/images/competitions/gemastik-ai.svg',
                'source_label' => 'Rulebook Resmi CompFest Fasilkom UI',
                'source_url' => 'https://compfest.id/rulebook',
            ],
            [
                'slug' => 'arkavidia-9-itb-2027',
                'name' => 'Arkavidia 9.0 — HMIF Institut Teknologi Bandung',
                'organizer' => 'Himpunan Mahasiswa Informatika ITB',
                'description' => 'Pesta teknologi dan kompetisi informatika berskala nasional dari ITB untuk mendorong inovasi digital generasi muda dalam menghadapi tantangan industri masa kini.',
                'category' => CompetitionCategory::Hackathon->value,
                'category_tracks' => [
                    'Arkavidia Hackathon',
                    'Datavidia (Data Science & AI)',
                    'UXvidia (UI/UX Design)',
                    'Competitive Programming Contest',
                ],
                'level' => 'national',
                'competition_type' => 'team',
                'official_url' => 'https://arkavidia.id',
                'registration_url' => 'https://arkavidia.id/register',
                'registration_opens_at' => Carbon::parse('2026-11-01 08:00:00'),
                'registration_deadline' => Carbon::parse('2027-04-25 23:59:59'),
                'starts_at' => Carbon::parse('2027-05-10 08:00:00'),
                'ends_at' => Carbon::parse('2027-06-30 17:00:00'),
                'eligibility' => 'Mahasiswa aktif D3/D4/S1 seluruh perguruan tinggi di Indonesia.',
                'min_team_size' => 2,
                'max_team_size' => 3,
                'prize_info' => 'Total Hadiah Rp 85.000.000 + Piala Rektor ITB + Sertifikat Juara Nasional',
                'cover_image' => '/images/competitions/hackathon-camp.svg',
                'source_label' => 'Buku Panduan Arkavidia ITB',
                'source_url' => 'https://arkavidia.id/guidebook',
            ],
            [
                'slug' => 'find-it-ugm-2027',
                'name' => 'Find IT 2027 — DTETI Universitas Gadjah Mada',
                'organizer' => 'Departemen Teknik Elektro & Teknologi Informasi UGM',
                'description' => 'Future Innovations and Discovery in IT (Find IT) adalah rangkaian kompetisi dan seminar nasional bidang teknologi informasi yang dihelat oleh mahasiswa DTETI FT UGM.',
                'category' => CompetitionCategory::Technology->value,
                'category_tracks' => [
                    'Hackathon',
                    'Data Analytics Competition',
                    'UX Design Competition',
                    'Competitive Programming',
                ],
                'level' => 'national',
                'competition_type' => 'team',
                'official_url' => 'https://find-it.id',
                'registration_url' => 'https://find-it.id/competition',
                'registration_opens_at' => Carbon::parse('2026-11-01 08:00:00'),
                'registration_deadline' => Carbon::parse('2027-05-20 23:59:59'),
                'starts_at' => Carbon::parse('2027-06-05 08:00:00'),
                'ends_at' => Carbon::parse('2027-07-15 17:00:00'),
                'eligibility' => 'Mahasiswa aktif program D3/D4/S1 perguruan tinggi se-Indonesia.',
                'min_team_size' => 2,
                'max_team_size' => 3,
                'prize_info' => 'Total Hadiah Rp 65.000.000 + Sertifikat UGM + Peluang Networking Industri',
                'cover_image' => '/images/competitions/iot-challenge.svg',
                'source_label' => 'Guidebook Find IT DTETI UGM',
                'source_url' => 'https://find-it.id/guidebook',
            ],
            [
                'slug' => 'pertamina-innovation-challenge-2027',
                'name' => 'Pertamina Innovation Challenge 2027',
                'organizer' => 'PT Pertamina (Persero)',
                'description' => 'Kompetisi karya inovasi energi hijau dan transformasi digital hulu-hilir bagi mahasiswa Indonesia untuk memacu transisi energi bersih dan ekonomi sirkular.',
                'category' => CompetitionCategory::BusinessPlan->value,
                'category_tracks' => [
                    'Energi Baru Terbarukan (EBT & Bioenergi)',
                    'Digital Transformation in Energy Logistics',
                    'Carbon Capture & Emission Reduction',
                    'Circular Economy & Green Campus',
                ],
                'level' => 'national',
                'competition_type' => 'team',
                'official_url' => 'https://pertamina.com',
                'registration_url' => 'https://ideaction.pertamina.com',
                'registration_opens_at' => Carbon::parse('2026-11-01 08:00:00'),
                'registration_deadline' => Carbon::parse('2027-06-30 23:59:59'),
                'starts_at' => Carbon::parse('2027-07-15 08:00:00'),
                'ends_at' => Carbon::parse('2027-09-30 17:00:00'),
                'eligibility' => 'Mahasiswa aktif S1/D4/D3 di seluruh perguruan tinggi Indonesia, tim 2-4 orang.',
                'min_team_size' => 2,
                'max_team_size' => 4,
                'prize_info' => 'Dana Pengembangan Ide Total Rp 150.000.000 + Kesempatan Magang Eksklusif di Pertamina + Inkubasi Solusi',
                'cover_image' => '/images/competitions/pkm-k.svg',
                'source_label' => 'Pertamina IdeAction Guideline',
                'source_url' => 'https://ideaction.pertamina.com/guideline',
            ],
            [
                'slug' => 'kdmi-debat-mahasiswa-2027',
                'name' => 'Kompetisi Debat Mahasiswa Indonesia (KDMI) 2027',
                'organizer' => 'Balai Pengembangan Talenta Indonesia (BPTI), Puspresnas',
                'description' => 'Kompetisi debat parlementer tingkat nasional berbahasa Indonesia yang mempertemukan pemikir kritis terbaik dari kampus-kampus di seluruh penjuru tanah air.',
                'category' => CompetitionCategory::ScientificWriting->value,
                'category_tracks' => [
                    'Debat Parlementer Kategori Utama',
                    'Kategori Pembicara Terbaik (Best Speaker)',
                ],
                'level' => 'national',
                'competition_type' => 'team',
                'official_url' => 'https://pusatprestasinasional.kemdikbud.go.id',
                'registration_url' => 'https://pusatprestasinasional.kemdikbud.go.id',
                'registration_opens_at' => Carbon::parse('2026-11-01 08:00:00'),
                'registration_deadline' => Carbon::parse('2027-05-01 23:59:59'),
                'starts_at' => Carbon::parse('2027-05-20 08:00:00'),
                'ends_at' => Carbon::parse('2027-07-20 17:00:00'),
                'eligibility' => 'Mahasiswa aktif Sarjana/Diploma terdaftar di PDDIKTI yang lolos seleksi wilayah LLDIKTI I-XVI.',
                'min_team_size' => 2,
                'max_team_size' => 3,
                'prize_info' => 'Medali Emas/Perak/Perunggu Puspresnas + Sertifikat Juara Nasional + Beasiswa Pembinaan Prestasi',
                'cover_image' => '/images/competitions/scientific-paper.svg',
                'source_label' => 'Pedoman Pelaksanaan KDMI BPTI Puspresnas',
                'source_url' => 'https://pusatprestasinasional.kemdikbud.go.id/pedoman-kdmi',
            ],
            [
                'slug' => 'bca-finhacks-2027',
                'name' => 'BCA Finhacks 2027 — Next-Gen AI Banking',
                'organizer' => 'PT Bank Central Asia Tbk',
                'description' => 'Hackathon perbankan digital terbesar di Indonesia untuk melahirkan inovasi teknologi finansial terdepan dengan memanfaatkan kecerdasan artifisial, open API, dan keamanan transaksi modern.',
                'category' => CompetitionCategory::Hackathon->value,
                'category_tracks' => [
                    'Generative AI for Financial Inclusion',
                    'Open Banking & Smart Payment Ecosystem',
                    'Fraud Detection & Cybersecurity',
                ],
                'level' => 'national',
                'competition_type' => 'team',
                'official_url' => 'https://finhacks.id',
                'registration_url' => 'https://finhacks.id',
                'registration_opens_at' => Carbon::parse('2026-11-01 08:00:00'),
                'registration_deadline' => Carbon::parse('2027-07-15 23:59:59'),
                'starts_at' => Carbon::parse('2027-08-01 08:00:00'),
                'ends_at' => Carbon::parse('2027-09-25 17:00:00'),
                'eligibility' => 'Mahasiswa aktif dan profesional muda WNI, tim beranggotakan 2-4 orang.',
                'min_team_size' => 2,
                'max_team_size' => 4,
                'prize_info' => 'Total Hadiah Tunai Rp 200.000.000 + Kesempatan Rekrutmen IT Management Trainee BCA tanpa tes awal',
                'cover_image' => '/images/competitions/hackathon-camp.svg',
                'source_label' => 'BCA Finhacks Official Terms & Conditions',
                'source_url' => 'https://finhacks.id/terms',
            ],
            [
                'slug' => 'kmhe-mobil-hemat-energi-2027',
                'name' => 'KMHE 2027 — Kontes Mobil Hemat Energi Nasional',
                'organizer' => 'Pusat Prestasi Nasional (Puspresnas) & Kemdiktisaintek',
                'description' => 'Ajang kompetisi rekayasa efisiensi kendaraan hemat energi ramah lingkungan bagi mahasiswa teknik Indonesia. Menguji ketahanan, aerodinamika, dan konsumsi energi minimum kendaraan prototype dan urban.',
                'category' => CompetitionCategory::Other->value,
                'category_tracks' => [
                    'Kategori Prototype (Motor Pembakaran Dalam, Motor Listrik, Etanol)',
                    'Kategori Urban Concept (Motor Pembakaran Dalam, Motor Listrik)',
                ],
                'level' => 'national',
                'competition_type' => 'team',
                'official_url' => 'https://pusatprestasinasional.kemdikbud.go.id',
                'registration_url' => 'https://pusatprestasinasional.kemdikbud.go.id',
                'registration_opens_at' => Carbon::parse('2026-11-01 08:00:00'),
                'registration_deadline' => Carbon::parse('2027-06-01 23:59:59'),
                'starts_at' => Carbon::parse('2027-06-20 08:00:00'),
                'ends_at' => Carbon::parse('2027-10-30 17:00:00'),
                'eligibility' => 'Tim mahasiswa perguruan tinggi di Indonesia dengan bimbingan dosen pembimbing riset otomotif.',
                'min_team_size' => 3,
                'max_team_size' => 6,
                'prize_info' => 'Piala Bergilir KMHE + Medali Puspresnas + Hibah Riset Kendaraan Listrik Ramah Lingkungan',
                'cover_image' => '/images/competitions/global-summit.svg',
                'source_label' => 'Pedoman Teknis KMHE Puspresnas',
                'source_url' => 'https://pusatprestasinasional.kemdikbud.go.id/pedoman-kmhe',
            ],
        ];

        foreach ($competitions as $data) {
            $sourceLabel = $data['source_label'];
            $sourceUrl = $data['source_url'];
            unset($data['source_label'], $data['source_url']);

            $data['campus_id'] = null; // Global scope
            $data['scope'] = CompetitionScope::Global;
            $data['created_by'] = $adminId;
            $data['status'] = CompetitionStatus::Open;
            $data['status_locked'] = false;
            $data['verification_status'] = VerificationStatus::Verified;
            $data['last_verified_at'] = now();
            $data['verified_by'] = $adminId;
            $data['moderation_status'] = 'visible';

            $comp = Competition::updateOrCreate(
                ['slug' => $data['slug']],
                $data
            );

            CompetitionSource::updateOrCreate(
                [
                    'competition_id' => $comp->id,
                    'url' => $sourceUrl,
                ],
                [
                    'label' => $sourceLabel,
                    'notes' => 'Diverifikasi langsung dari dokumen resmi penyelenggara tahun berjalan.',
                    'verified_at' => now(),
                    'verified_by' => $adminId,
                ]
            );
        }

        // Setup active recruiting teams for MinSatu Matchmaking
        $this->seedRecruitingTeams($admin);
    }

    private function seedRecruitingTeams(?User $admin): void
    {
        // Find existing student users or create realistic squad leaders
        $studentLeaders = User::whereHas('memberships', function ($q) {
            $q->where('role', 'student');
        })->take(4)->get();

        if ($studentLeaders->isEmpty()) {
            return;
        }

        $recruitingSetups = [
            [
                'comp_slug' => 'gemastik-xviii-2027',
                'team_name' => 'Garuda Cyber Solution',
                'description' => 'Membangun platform mitigasi ancaman ransomware untuk fasilitas kesehatan daerah. Butuh rekan solid yang menguasai Backend Laravel/Go dan Security.',
                'track' => 'Pengembangan Perangkat Lunak (Software Development)',
                'roles' => [
                    ['name' => 'Backend Engineer', 'slots' => 1, 'requirements' => 'Paham REST API, database relasional, dan clean architecture.'],
                    ['name' => 'UI/UX Designer', 'slots' => 1, 'requirements' => 'Terbiasa wireframing, high-fidelity Figma, dan usability testing.'],
                ],
            ],
            [
                'comp_slug' => 'pkm-pimnas-2027',
                'team_name' => 'AgriSens Nusantara',
                'description' => 'Proposal PKM-Karya Inovatif: Sistem pemantau nutrisi hidroponik berbasis sensor spektrometri murah untuk petani urban.',
                'track' => 'PKM-KC (Karsa Cipta)',
                'roles' => [
                    ['name' => 'IoT Hardware Engineer', 'slots' => 1, 'requirements' => 'Paham mikrokontroler ESP32/Arduino dan rangkaian sensor analog.'],
                    ['name' => 'Penyusun Proposal / Riset', 'slots' => 1, 'requirements' => 'Teliti dalam sitasi ilmiah Mendeley dan kepatuhan pedoman Belmawa.'],
                ],
            ],
            [
                'comp_slug' => 'microsoft-imagine-cup-2027',
                'team_name' => 'AuraCare AI',
                'description' => 'Aplikasi deteksi dini gangguan penglihatan berbasis Azure Custom Vision dan edge computing smartphone untuk posyandu.',
                'track' => 'Health & Biotech',
                'roles' => [
                    ['name' => 'Machine Learning Engineer', 'slots' => 1, 'requirements' => 'Paham transfer learning, model quantization, dan Python.'],
                    ['name' => 'Mobile Developer (Flutter)', 'slots' => 1, 'requirements' => 'Pengalaman integrasi API kamera dan state management.'],
                ],
            ],
            [
                'comp_slug' => 'lidm-2027',
                'team_name' => 'Nusantara EduVR',
                'description' => 'Media pembelajaran digital interaktif berbasis web 3D untuk pengenalan anatomi sains bagi siswa sekolah dasar pelosok.',
                'track' => 'Divisi 1: Inovasi Teknologi Digital Pendidikan',
                'roles' => [
                    ['name' => '3D / Technical Artist', 'slots' => 1, 'requirements' => 'Mampu modeling low-poly Blender dan export GLTF/Three.js.'],
                    ['name' => 'Instructional Designer', 'slots' => 1, 'requirements' => 'Paham kurikulum merdeka dan pedagogi pembelajaran digital.'],
                ],
            ],
        ];

        foreach ($recruitingSetups as $index => $setup) {
            $comp = Competition::where('slug', $setup['comp_slug'])->first();
            if (!$comp) continue;

            $leader = $studentLeaders->get($index % $studentLeaders->count());
            if (!$leader) continue;

            $campusId = $leader->campusId() ?? 1;

            // Create or update competition team
            $team = Team::updateOrCreate(
                [
                    'name' => $setup['team_name'],
                    'type' => TeamType::Competition,
                ],
                [
                    'campus_id' => $campusId,
                    'leader_id' => $leader->id,
                    'description' => $setup['description'],
                    'capacity' => $comp->max_team_size,
                    'status' => TeamStatus::AwaitingMembers,
                ]
            );

            // Ensure leader is enrolled in team
            TeamMember::firstOrCreate(
                [
                    'team_id' => $team->id,
                    'user_id' => $leader->id,
                ],
                [
                    'role_name' => 'Ketua Tim',
                    'permission' => TeamPermission::Leader,
                    'status' => 'active',
                    'joined_at' => now(),
                ]
            );

            // Create or update participation
            $participation = CompetitionParticipation::updateOrCreate(
                [
                    'competition_id' => $comp->id,
                    'team_id' => $team->id,
                ],
                [
                    'category_track' => $setup['track'],
                    'stage' => 'recruiting',
                    'is_formation_locked' => false,
                    'formation_status' => 'pending',
                ]
            );

            // Create or update recruitment
            $recruitment = Recruitment::updateOrCreate(
                ['team_id' => $team->id],
                [
                    'title' => 'Open Recruitment: ' . $setup['team_name'],
                    'description' => $setup['description'],
                    'status' => RecruitmentStatus::Open,
                ]
            );

            // Create recruitment roles
            foreach ($setup['roles'] as $roleData) {
                RecruitmentRole::updateOrCreate(
                    [
                        'recruitment_id' => $recruitment->id,
                        'name' => $roleData['name'],
                    ],
                    [
                        'slots' => $roleData['slots'],
                        'requirements' => $roleData['requirements'],
                    ]
                );
            }
        }
    }
}
