import SiteHeader from '@/components/public/SiteHeader'
import HomeHero from '@/components/public/HomeHero'
import HomeScrollExperience from '@/components/public/HomeScrollExperience'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#050b16] text-white">
      <SiteHeader />
      <HomeHero />
      <HomeScrollExperience />
    </main>
  )
}