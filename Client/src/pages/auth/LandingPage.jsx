import { Link } from 'react-router-dom'
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { MdRocketLaunch, MdCode, MdSyncAlt, MdSupportAgent, MdFavorite, MdStar, MdBolt, MdLightbulb, MdTrendingUp, MdSecurity, MdSpeed, MdPeople, MdBusiness, MdAnalytics, MdCloudDone } from "react-icons/md"
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger)

export default function LandingPage() {

  const heroRef = useRef(null)

  const servicesRef = useRef(null)

  const featuresRef = useRef(null)

  const statsRef = useRef(null)

  const ctaRef = useRef(null)

  useEffect(() => {
    // Hero animations - faster and from top
    gsap.fromTo(heroRef.current, 
      { opacity: 0, y: -50 }, // Changed from y: 50 to y: -50 (comes from top)
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" } // Reduced duration from 1 to 0.6
    )

    // Services cards animation
    gsap.fromTo(servicesRef.current.children,
      { opacity: 0, y: 100, scale: 0.8 },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        duration: 0.8, 
        stagger: 0.2,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: servicesRef.current,
          start: "top 80%",
          end: "bottom 20%",
        }
      }
    )

    // Features animation
    gsap.fromTo(featuresRef.current.children,
      { opacity: 0, x: -100 },
      { 
        opacity: 1, 
        x: 0, 
        duration: 0.8, 
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 80%",
        }
      }
    )

    // Stats animation
    gsap.fromTo(statsRef.current.children,
      { opacity: 0, scale: 0.5 },
      { 
        opacity: 1, 
        scale: 1, 
        duration: 0.6, 
        stagger: 0.1,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: statsRef.current,
          start: "top 80%",
        }
      }
    )

    // CTA animation
    gsap.fromTo(ctaRef.current,
      { opacity: 0, y: 50 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ctaRef.current,
          start: "top 80%",
        }
      }
    )

    // Floating animation for hero icon - start after hero animation
    gsap.to(heroRef.current?.querySelector('.floating-icon'), {
      y: -20,
      duration: 2,
      ease: "power1.inOut",
      yoyo: true,
      repeat: -1,
      delay: 0.6 // Start floating after hero animation completes
    })

  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-white relative overflow-hidden w-full py-10">

      {/* Header with Sign In Button */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6">

        <div className="flex justify-end">

          <Link to="/login">
            <Button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <MdRocketLaunch className="inline align-middle mr-2" size={18} />
              Sign In
            </Button>
          </Link>

        </div>
        
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-red-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="w-full">
          {/* Hero Section */}
          <div ref={heroRef} className="text-center mb-20">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-red-500 to-red-600 rounded-full mb-8 shadow-2xl floating-icon">
              <MdRocketLaunch className="text-white" size={56} />
            </div>
            <h1 className="text-7xl md:text-8xl font-bold text-gray-900 mb-6 tracking-tight">
              Welcome to
              <span className="block bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
                SIRE TECH
              </span>
            </h1>
            <p className="text-2xl md:text-3xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
              Empowering businesses with cutting-edge technology solutions that drive innovation and growth
            </p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Transform your business with our comprehensive suite of digital solutions, expert consulting, and innovative software development services.
            </p>
          </div>

          {/* Services Grid */}
          <div ref={servicesRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 max-w-7xl mx-auto">
            <Card className="bg-gradient-to-br from-red-50 to-red-100 backdrop-blur-lg border-red-200 hover:bg-red-200 transition-all duration-500 group transform hover:scale-105 hover:shadow-2xl">
              <CardContent className="p-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <MdCode className="text-white" size={44} />
                </div>
                <h3 className="text-2xl font-bold text-red-900 mb-4">Software Development</h3>
                <p className="text-red-800/80 text-lg leading-relaxed">Custom applications and innovative web solutions tailored to your specific business needs and requirements.</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 backdrop-blur-lg border-red-200 hover:bg-red-200 transition-all duration-500 group transform hover:scale-105 hover:shadow-2xl">
              <CardContent className="p-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <MdSyncAlt className="text-white" size={44} />
                </div>
                <h3 className="text-2xl font-bold text-red-900 mb-4">Digital Transformation</h3>
                <p className="text-red-800/80 text-lg leading-relaxed">Modernize your business processes with cutting-edge digital solutions that streamline operations.</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 backdrop-blur-lg border-red-200 hover:bg-red-200 transition-all duration-500 group transform hover:scale-105 hover:shadow-2xl">
              <CardContent className="p-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <MdSupportAgent className="text-white" size={44} />
                </div>
                <h3 className="text-2xl font-bold text-red-900 mb-4">Tech Consulting</h3>
                <p className="text-red-800/80 text-lg leading-relaxed">Strategic technology guidance to optimize your business operations and maximize efficiency.</p>
              </CardContent>
            </Card>
          </div>

          {/* Features Section */}
          <div ref={featuresRef} className="mb-20 max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-gray-900 mb-6">Why Choose SIRE TECH?</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">Discover the advantages that set us apart in the technology industry</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MdSpeed className="text-red-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Lightning Fast</h3>
                <p className="text-gray-600">Optimized performance and rapid deployment for your projects</p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MdSecurity className="text-red-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Enterprise Security</h3>
                <p className="text-gray-600">Bank-level security protocols to protect your valuable data</p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MdTrendingUp className="text-red-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Scalable Solutions</h3>
                <p className="text-gray-600">Grow with confidence using our scalable architecture</p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MdPeople className="text-red-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Expert Team</h3>
                <p className="text-gray-600">Experienced professionals dedicated to your success</p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MdAnalytics className="text-red-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Data-Driven</h3>
                <p className="text-gray-600">Insights and analytics to drive informed decisions</p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MdCloudDone className="text-red-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Cloud-Native</h3>
                <p className="text-gray-600">Modern cloud infrastructure for reliability and performance</p>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div ref={statsRef} className="mb-20">
            <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-3xl p-12 text-white">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">Trusted by Industry Leaders</h2>
                <p className="text-xl opacity-90">Our track record speaks for itself</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold mb-2">500+</div>
                  <div className="text-lg opacity-90">Projects Completed</div>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-2">50+</div>
                  <div className="text-lg opacity-90">Happy Clients</div>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-2">99.9%</div>
                  <div className="text-lg opacity-90">Uptime Guarantee</div>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-2">24/7</div>
                  <div className="text-lg opacity-90">Support Available</div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div ref={ctaRef} className="text-center">
            <div className="bg-gradient-to-br from-gray-50 to-red-50 backdrop-blur-lg rounded-3xl p-12 border border-gray-200 max-w-5xl mx-auto shadow-2xl">
              <h2 className="text-5xl font-bold text-gray-900 mb-6">Ready to Transform Your Business?</h2>
              <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                Join hundreds of successful businesses that have already transformed their operations with SIRE TECH. Access your personalized dashboard and explore our powerful tools and insights.
              </p>

              {/* Button Showcase */}
              <div className="flex flex-wrap gap-4 justify-center mb-10">
                <Button className="bg-red-500 hover:bg-red-700 text-white transform hover:scale-105 transition-all duration-300">
                  <MdFavorite className="inline align-middle mr-2" />
                  Red Primary
                </Button>
                <Button className="bg-red-600 hover:bg-red-800 text-white transform hover:scale-105 transition-all duration-300">
                  <MdStar className="inline align-middle mr-2" />
                  Red Secondary
                </Button>
                <Button className="bg-red-700 hover:bg-red-900 text-white transform hover:scale-105 transition-all duration-300">
                  <MdBolt className="inline align-middle mr-2" />
                  Red Dark
                </Button>
                <Button className="bg-white text-red-700 border border-red-700 hover:bg-red-50 hover:text-red-900 transform hover:scale-105 transition-all duration-300">
                  <MdLightbulb className="inline align-middle mr-2" />
                  White/Red
                </Button>
              </div>

              <Link to="/login">
                <Button size="lg" className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-10 py-6 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
                  <MdRocketLaunch className="inline align-middle mr-3" size={24} />
                  Sign In to Dashboard
                </Button>
              </Link>
              
              <p className="text-sm text-gray-500 mt-8">
                Contact your administrator for account access • Enterprise-grade security • 24/7 support
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}