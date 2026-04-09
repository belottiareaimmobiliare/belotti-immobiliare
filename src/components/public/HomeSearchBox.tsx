import HomeSearchBoxDesktop from '@/components/public/HomeSearchBoxDesktop'
import HomeSearchBoxMobile from '@/components/public/HomeSearchBoxMobile'

export default function HomeSearchBox() {
  return (
    <>
      <div className="hidden md:block">
        <HomeSearchBoxDesktop />
      </div>

      <div className="md:hidden">
        <HomeSearchBoxMobile />
      </div>
    </>
  )
}