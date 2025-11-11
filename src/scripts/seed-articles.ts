import AppDataSource from '../config/database';
import { Article } from '../entities/Article';
import { ArticleCategory } from '../entities/ArticleCategory';
import { User } from '../entities/User';
import * as dotenv from 'dotenv';

dotenv.config();

async function seedArticles() {
    try {
        // Initialize database connection
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        console.log('✅ Database connected successfully');

        // Get admin user
        const admin = await AppDataSource.getRepository(User).findOne({
            where: { email: 'admin@ramein.com' }
        });

        if (!admin) {
            console.log('❌ Admin user not found. Please run main seed first.');
            process.exit(1);
        }

        // Create article categories
        const categoryRepo = AppDataSource.getRepository(ArticleCategory);
        const categories = [
            {
                name: 'Community',
                slug: 'community',
                description: 'Cerita dan pengalaman dari komunitas event organizer'
            },
            {
                name: 'Event Planning',
                slug: 'event-planning',
                description: 'Tips dan strategi perencanaan event yang efektif'
            },
            {
                name: 'Industry Insights',
                slug: 'industry-insights',
                description: 'Analisis dan tren industri event management'
            },
            {
                name: 'Technology',
                slug: 'technology',
                description: 'Teknologi terbaru dalam event management'
            },
            {
                name: 'Tips & Tricks',
                slug: 'tips-tricks',
                description: 'Tips praktis untuk event yang sukses'
            }
        ];

        const createdCategories: { [key: string]: ArticleCategory } = {};

        for (const categoryData of categories) {
            let category = await categoryRepo.findOne({
                where: { slug: categoryData.slug }
            });

            if (!category) {
                category = categoryRepo.create(categoryData);
                await categoryRepo.save(category);
                console.log(`✅ Category '${categoryData.name}' created`);
            } else {
                console.log(`⚠️  Category '${categoryData.name}' already exists`);
            }

            createdCategories[categoryData.slug] = category;
        }

        // Create articles
        const articleRepo = AppDataSource.getRepository(Article);
        
        const articles = [
            // Community Articles
            {
                title: 'Bagaimana Komunitas Tech Meetup Jakarta Berkembang',
                slug: 'bagaimana-komunitas-tech-meetup-jakarta-berkembang',
                excerpt: 'Kisah inspiratif dari Tech Meetup Jakarta yang berhasil tumbuh dari 10 menjadi 500+ anggota aktif',
                content: `
# Bagaimana Komunitas Tech Meetup Jakarta Berkembang

Komunitas Tech Meetup Jakarta memulai perjalanan mereka pada tahun 2020 dengan hanya 10 anggota. Kini, mereka telah berkembang menjadi salah satu komunitas tech terbesar di Indonesia dengan lebih dari 500 anggota aktif.

## Kunci Kesuksesan

1. **Konsistensi**: Mengadakan meetup rutin setiap bulan tanpa terlewat
2. **Konten Berkualitas**: Menghadirkan speaker yang berpengalaman dan topik yang relevan
3. **Networking**: Memberikan waktu yang cukup untuk networking antar peserta
4. **Platform Digital**: Memanfaatkan platform seperti Ramein untuk manajemen event yang efisien

## Pelajaran yang Dipetik

> "Kunci utama adalah konsistensi dan mendengarkan feedback dari komunitas" - Founder Tech Meetup Jakarta

Dengan menggunakan platform event management yang tepat, mereka berhasil mengotomasi registrasi, absensi, dan distribusi sertifikat, sehingga bisa fokus pada konten event.
                `,
                coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
                categorySlug: 'community',
                tags: ['community', 'tech-meetup', 'success-story'],
                readTime: '5 min'
            },
            {
                title: '10 Tips Sukses Mengelola Event Virtual',
                slug: '10-tips-sukses-mengelola-event-virtual',
                excerpt: 'Panduan lengkap untuk mengadakan event virtual yang engaging dan berkesan',
                content: `
# 10 Tips Sukses Mengelola Event Virtual

Event virtual telah menjadi pilihan populer sejak pandemi. Berikut adalah 10 tips untuk kesuksesan event virtual Anda:

## 1. Pilih Platform yang Tepat
Gunakan platform yang stabil dan user-friendly untuk peserta Anda.

## 2. Persiapan Teknis
Lakukan testing audio, video, dan koneksi internet sebelum event dimulai.

## 3. Engagement Interaktif
Gunakan polls, Q&A, dan breakout rooms untuk meningkatkan partisipasi.

## 4. Materi Visual Menarik
Siapkan slide presentasi yang eye-catching dan mudah dibaca.

## 5. Waktu yang Optimal
Event virtual sebaiknya tidak lebih dari 2 jam untuk menjaga fokus peserta.

## 6. Recording & Replay
Rekam event untuk peserta yang tidak bisa hadir live.

## 7. Networking Session
Sediakan waktu khusus untuk networking virtual.

## 8. Technical Support
Siapkan tim support untuk membantu peserta dengan masalah teknis.

## 9. Follow Up
Kirim email follow-up dengan materi dan recording event.

## 10. Feedback Collection
Kumpulkan feedback untuk meningkatkan event berikutnya.
                `,
                coverImage: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=1200',
                categorySlug: 'event-planning',
                tags: ['virtual-event', 'tips', 'best-practices'],
                readTime: '8 min'
            },
            {
                title: 'Tren Event Management 2024: Yang Perlu Anda Ketahui',
                slug: 'tren-event-management-2024',
                excerpt: 'Analisis mendalam tentang tren terbaru dalam industri event management di tahun 2024',
                content: `
# Tren Event Management 2024: Yang Perlu Anda Ketahui

Industri event management terus berkembang. Berikut adalah tren utama tahun 2024:

## 1. Hybrid Events
Kombinasi event fisik dan virtual menjadi standar baru, memberikan fleksibilitas maksimal kepada peserta.

## 2. AI & Automation
- Chatbot untuk customer service 24/7
- Automated scheduling dan reminders
- Personalized recommendations untuk peserta

## 3. Sustainability Focus
Event organizer semakin fokus pada praktik ramah lingkungan:
- Paperless event
- Virtual swag bags
- Carbon offset programs

## 4. Data-Driven Decision Making
Analitik event yang mendalam membantu organizer membuat keputusan berdasarkan data real.

## 5. Immersive Experiences
Penggunaan AR/VR untuk menciptakan pengalaman yang lebih engaging.

## Kesimpulan
Adopsi teknologi dan fokus pada pengalaman peserta adalah kunci sukses event di tahun 2024.
                `,
                coverImage: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=1200',
                categorySlug: 'industry-insights',
                tags: ['trends', '2024', 'event-management'],
                readTime: '6 min'
            },
            {
                title: 'Menggunakan QR Code untuk Efisiensi Check-in Event',
                slug: 'menggunakan-qr-code-untuk-check-in-event',
                excerpt: 'Bagaimana teknologi QR code dapat mempercepat proses check-in dan meningkatkan pengalaman peserta',
                content: `
# Menggunakan QR Code untuk Efisiensi Check-in Event

QR code telah merevolusi cara kita melakukan check-in event. Berikut adalah manfaatnya:

## Keuntungan QR Code Check-in

### 1. Kecepatan
- Check-in hanya membutuhkan 2-3 detik per peserta
- Mengurangi antrian panjang di pintu masuk
- Pengalaman peserta yang lebih smooth

### 2. Akurasi Data
- Eliminasi human error dalam pencatatan
- Data real-time untuk organizer
- Tracking kehadiran yang akurat

### 3. Contactless
- Lebih higienis (penting post-pandemic)
- Mengurangi interaksi fisik
- Peserta lebih nyaman

## Implementasi

Dengan platform seperti Ramein, setiap peserta mendapat:
- QR code unik via email
- Token 10 digit sebagai backup
- Notifikasi otomatis saat check-in berhasil

## Best Practices
1. Test sistem sebelum event
2. Siapkan backup manual untuk berjaga-jaga
3. Pastikan pencahayaan yang cukup untuk scanning
4. Training staff tentang prosedur

## ROI
Event dengan 500 peserta dapat menghemat hingga 2-3 jam waktu check-in dibanding metode manual!
                `,
                coverImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200',
                categorySlug: 'technology',
                tags: ['qr-code', 'check-in', 'automation'],
                readTime: '7 min'
            },
            {
                title: 'Panduan Lengkap Email Marketing untuk Event',
                slug: 'panduan-email-marketing-untuk-event',
                excerpt: 'Strategi email marketing yang efektif untuk meningkatkan registrasi dan engagement event Anda',
                content: `
# Panduan Lengkap Email Marketing untuk Event

Email marketing masih menjadi salah satu channel paling efektif untuk promosi event. Berikut panduannya:

## Fase Pre-Event

### 1. Save the Date (H-30)
- Subject line yang menarik
- Informasi singkat tentang event
- CTA untuk mendaftar

### 2. Early Bird Promotion (H-21)
- Penawaran khusus untuk pendaftar awal
- Urgency dengan countdown
- Benefit yang jelas

### 3. Reminder Series (H-14, H-7, H-3)
- Update agenda event
- Profil speaker
- Logistik (lokasi, waktu, dress code)

## Fase Event

### 4. Day Before (H-1)
- Final reminder
- Checklist untuk peserta
- Link atau QR code untuk check-in

### 5. Day Of Event (H-0)
- Morning reminder
- Last minute information
- Support contact

## Fase Post-Event

### 6. Thank You Email (H+1)
- Ucapan terima kasih
- Survey feedback
- Link ke materi event

### 7. Certificate Distribution (H+3)
- Sertifikat kehadiran
- Dokumentasi event
- Announcement event berikutnya

## Tips Pro
✅ Personalisasi dengan nama peserta  
✅ Mobile-friendly design  
✅ Clear CTA button  
✅ A/B testing subject lines  
✅ Segment audience berdasarkan behavior  

## Metrics to Track
- Open rate (target: 20-30%)
- Click-through rate (target: 3-5%)
- Conversion rate (target: 10-15%)
                `,
                coverImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200',
                categorySlug: 'tips-tricks',
                tags: ['email-marketing', 'promotion', 'engagement'],
                readTime: '10 min'
            },
            {
                title: 'Cara Membuat Sertifikat Digital yang Professional',
                slug: 'cara-membuat-sertifikat-digital-professional',
                excerpt: 'Tutorial step-by-step membuat sertifikat digital yang menarik dan mudah diverifikasi',
                content: `
# Cara Membuat Sertifikat Digital yang Professional

Sertifikat digital adalah bentuk apresiasi yang penting untuk peserta event. Berikut cara membuatnya:

## Elemen Penting Sertifikat

### 1. Design Elements
- **Logo organisasi** di header
- **Judul sertifikat** yang jelas (Certificate of Attendance/Completion)
- **Nama peserta** dengan font yang prominent
- **Nama event** dan tanggal pelaksanaan
- **Tanda tangan** pihak berwenang

### 2. Verification System
- QR code untuk verifikasi online
- Nomor sertifikat unik
- Link verifikasi ke database

### 3. Format File
- PDF untuk easy sharing
- High resolution (300 DPI minimum)
- File size optimal (< 1MB)

## Automated Certificate Generation

Platform seperti Ramein menyediakan:
- Template sertifikat customizable
- Auto-generate setelah attendance confirmed
- Bulk distribution via email
- Verification system built-in

## Design Tips

### Do's ✅
- Gunakan brand colors
- Font yang mudah dibaca
- Layout yang balanced
- White space yang cukup

### Don'ts ❌
- Terlalu banyak warna
- Font yang sulit dibaca
- Overcrowded design
- Low resolution images

## Distribution Strategy

1. **Timing**: Kirim H+3 setelah event
2. **Medium**: Email dengan PDF attachment
3. **Backup**: Sediakan download link di dashboard
4. **Reminder**: Follow-up untuk yang belum download

## Legal Considerations
- Pastikan data nama peserta akurat
- Include disclaimer jika ada
- Simpan database sertifikat minimal 3 tahun
- GDPR compliance untuk data protection
                `,
                coverImage: 'https://images.unsplash.com/photo-1569098644584-210bcd375b59?w=1200',
                categorySlug: 'technology',
                tags: ['certificate', 'digital', 'automation'],
                readTime: '9 min'
            },
            {
                title: 'Membangun Komunitas Event yang Engaged',
                slug: 'membangun-komunitas-event-engaged',
                excerpt: 'Strategi jangka panjang untuk membangun dan mempertahankan komunitas event yang aktif',
                content: `
# Membangun Komunitas Event yang Engaged

Komunitas yang engaged adalah aset berharga untuk event organizer. Berikut strateginya:

## Foundation Building

### 1. Define Your Tribe
- Siapa target audience Anda?
- Apa value yang mereka cari?
- Bagaimana Anda bisa membantu mereka?

### 2. Create Core Values
Komunitas yang kuat memiliki nilai inti yang jelas:
- Learning & Growth
- Collaboration
- Innovation
- Inclusivity

## Engagement Strategies

### Regular Touchpoints
📅 **Monthly Events** - Konsistensi adalah kunci  
💬 **Online Community** - WhatsApp/Telegram group  
📧 **Newsletter** - Update berkala  
📱 **Social Media** - Active presence  

### Content Strategy
- Share success stories dari members
- Highlight member achievements
- Behind-the-scenes content
- Educational resources

## Retention Tactics

### 1. Recognition Program
- Featured member setiap bulan
- Certificate of appreciation
- Speaking opportunities

### 2. Exclusive Benefits
- Early bird access
- Member-only events
- Networking opportunities
- Resource library

### 3. Feedback Loop
- Regular surveys
- Open forum discussions
- Direct communication channels

## Measurement

Key Metrics:
- **Attendance rate**: Berapa % members yang hadir
- **Repeat attendance**: Members yang datang >3x
- **Referral rate**: Members yang membawa teman
- **Engagement score**: Likes, comments, shares

## Success Story

Community XYZ berhasil:
- 80% retention rate year over year
- 500+ active members
- 12 events per year dengan rata-rata 100+ peserta
- Net Promoter Score (NPS) 70+

## Tools & Platform

Gunakan platform yang tepat:
✅ Event management: Ramein  
✅ Communication: Slack/Discord  
✅ Content: Notion/Google Workspace  
✅ Analytics: Google Analytics  

## Kesimpulan

Membangun komunitas butuh waktu dan dedikasi, tapi return on investment-nya sangat besar. Fokus pada value creation dan authentic connections.
                `,
                coverImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200',
                categorySlug: 'community',
                tags: ['community-building', 'engagement', 'strategy'],
                readTime: '12 min'
            },
            {
                title: 'ROI Event: Cara Mengukur Kesuksesan Event Anda',
                slug: 'roi-event-cara-mengukur-kesuksesan',
                excerpt: 'Panduan komprehensif untuk mengukur Return on Investment dari event yang Anda selenggarakan',
                content: `
# ROI Event: Cara Mengukur Kesuksesan Event Anda

Mengukur kesuksesan event bukan hanya tentang jumlah peserta. Berikut metrik yang penting:

## Financial Metrics

### 1. Revenue vs Cost
\`\`\`
ROI = (Revenue - Cost) / Cost × 100%
\`\`\`

**Revenue Sources:**
- Ticket sales
- Sponsorship
- Merchandise
- Post-event sales

**Cost Components:**
- Venue rental
- Equipment
- Marketing
- Staff
- Catering
- Platform/technology

### 2. Cost Per Acquisition (CPA)
\`\`\`
CPA = Total Marketing Cost / Number of Registrations
\`\`\`

## Non-Financial Metrics

### 3. Attendance Rate
\`\`\`
Attendance Rate = (Attendees / Registrations) × 100%
\`\`\`
Target: 70-85%

### 4. Engagement Score
- Session participation
- Q&A activity
- Networking interactions
- Post-event survey response rate

### 5. Net Promoter Score (NPS)
"Seberapa besar kemungkinan Anda merekomendasikan event ini?"
- Score 0-6: Detractors
- Score 7-8: Passives
- Score 9-10: Promoters

\`\`\`
NPS = % Promoters - % Detractors
\`\`\`

## Lead Generation Metrics

### 6. Qualified Leads
- Berapa leads yang collected?
- Conversion rate ke customer
- Lifetime value dari leads

### 7. Brand Awareness
- Social media mentions
- Media coverage
- Website traffic spike
- New followers

## Post-Event Metrics

### 8. Content Performance
- Video views
- Slide downloads
- Blog post shares
- Email open rates

### 9. Community Growth
- New members joined
- Repeat attendance commitment
- Referral rate

## Dashboard Metrics

Platform seperti Ramein menyediakan:
- Real-time attendance tracking
- Registration analytics
- Revenue dashboard
- Participant demographics
- Engagement heatmaps

## Case Study

**Tech Conference 2023**
- Budget: Rp 50,000,000
- Revenue: Rp 85,000,000
- **ROI: 70%**
- Attendance: 350/400 (87.5%)
- NPS: 65
- Leads generated: 120
- Conversion: 18 customers

## Action Items

After calculating ROI:
1. ✅ Identify what worked well
2. ✅ Analyze what didn't
3. ✅ Document lessons learned
4. ✅ Share insights with team
5. ✅ Plan improvements for next event

## Tools for Measurement

- **Analytics**: Google Analytics, Mixpanel
- **Survey**: Typeform, Google Forms
- **CRM**: HubSpot, Salesforce
- **Event Platform**: Ramein Dashboard

Remember: The best ROI is one that creates long-term value and relationships!
                `,
                coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200',
                categorySlug: 'industry-insights',
                tags: ['roi', 'metrics', 'analytics', 'success-measurement'],
                readTime: '11 min'
            }
        ];

        // Save articles
        for (const articleData of articles) {
            const exists = await articleRepo.findOne({
                where: { slug: articleData.slug }
            });

            if (!exists) {
                const category = createdCategories[articleData.categorySlug];
                
                const article = articleRepo.create({
                    title: articleData.title,
                    slug: articleData.slug,
                    excerpt: articleData.excerpt,
                    content: articleData.content,
                    coverImage: articleData.coverImage,
                    categoryId: category.id,
                    authorId: admin.id,
                    authorName: admin.name,
                    publishedAt: new Date(),
                    readTime: articleData.readTime,
                    tags: articleData.tags,
                    isPublished: true,
                    isDraft: false,
                    viewCount: Math.floor(Math.random() * 500) + 50
                });

                await articleRepo.save(article);
                console.log(`✅ Article '${articleData.title}' created`);
            } else {
                console.log(`⚠️  Article '${articleData.title}' already exists`);
            }
        }

        console.log('✅ All articles seeded successfully');
        
        // Close connection
        await AppDataSource.destroy();
        console.log('✅ Database connection closed');

    } catch (error) {
        console.error('❌ Error seeding articles:', error);
        process.exit(1);
    }
}

// Run seed if this file is executed directly
if (require.main === module) {
    seedArticles();
}

export default seedArticles;
