import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Baby, 
  Heart, 
  Users, 
  BookOpen, 
  Shield, 
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Star,
  Play,
  BarChart3
} from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const features = [
    {
      icon: Baby,
      title: "Child Development Tracking",
      description: "Monitor growth, health, and developmental milestones of every child in the anganwadi."
    },
    {
      icon: Heart,
      title: "Health Management",
      description: "Comprehensive health records, vaccination tracking, and nutrition monitoring."
    },
    {
      icon: Users,
      title: "Family Engagement",
      description: "Connect with families, track home visits, and improve community participation."
    },
    {
      icon: BookOpen,
      title: "Educational Progress",
      description: "Track learning outcomes, attendance, and educational activities."
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Bank-level security with offline capabilities and data backup."
    },
    {
      icon: TrendingUp,
      title: "Analytics & Reports",
      description: "Generate insights and reports for better decision making."
    }
  ];

  const stats = [
    { number: "10,000+", label: "Children Served" },
    { number: "500+", label: "Anganwadis" },
    { number: "50+", label: "Districts" },
    { number: "99.9%", label: "Uptime" }
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Anganwadi Worker",
      content: "SampoornaAngan has transformed how we manage our center. Everything is so organized now!",
      rating: 5
    },
    {
      name: "Dr. Rajesh Kumar",
      role: "Block Coordinator",
      content: "The reporting features help us track progress across all centers efficiently.",
      rating: 5
    },
    {
      name: "Meera Devi",
      role: "ASHA Volunteer",
      content: "Family engagement has improved significantly since we started using this system.",
      rating: 5
    }
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section - Pure White Background */}
      <section className="relative min-h-screen bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen py-20">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              {/* Logo Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-4 bg-white rounded-full px-8 py-4 shadow-xl border border-gray-100 backdrop-blur-sm"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-full flex items-center justify-center shadow-lg">
                  <Baby className="w-7 h-7 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-black text-lg tracking-wide">SampoornaAngan</span>
                  <span className="text-xs text-black font-medium tracking-wider uppercase">Management System</span>
                </div>
              </motion.div>

              {/* Main Heading */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-6"
              >
                <h1 className="elegant-heading text-5xl md:text-7xl font-extrabold text-black leading-tight">
                  <span className="block font-light text-3xl md:text-4xl mb-3 text-black tracking-wide">Complete</span>
                  <span className="block text-black font-black tracking-tight">
                    Anganwadi Management
                  </span>
                  <span className="block text-4xl md:text-6xl font-semibold mt-3 text-black tracking-tight">System</span>
                </h1>
                
                <div className="elegant-text space-y-4 max-w-2xl">
                  <p className="text-xl md:text-2xl text-black font-medium leading-relaxed tracking-wide">
                    Streamline child development tracking, family engagement, and administrative tasks
                  </p>
                  <p className="text-lg md:text-xl text-black leading-relaxed">
                    with our comprehensive digital platform designed for modern anganwadis.
                  </p>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                <Link 
                  to="/register"
                  className="group bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold px-10 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3 cursor-pointer no-underline"
                >
                  <span className="text-lg">Get Started Free</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>

                <button 
                  onClick={() => navigate('/login')}
                  className="group bg-white border-2 border-primary-400 hover:border-primary-600 text-primary-600 hover:text-primary-700 font-semibold px-10 py-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-3 cursor-pointer"
                >
                  <span className="text-lg">Login</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
                
                <button type="button" className="group bg-white border-2 border-gray-200 hover:border-primary-300 text-black font-semibold px-10 py-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-3 cursor-pointer">
                  <Play className="w-5 h-5 text-primary-600 group-hover:text-primary-700 transition-colors duration-300" />
                  <span className="text-lg">Watch Demo</span>
                </button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex items-center justify-between gap-8 pt-12 max-w-lg"
              >
                <div className="text-center group">
                  <div className="text-3xl font-black text-black mb-1">500+</div>
                  <div className="text-sm font-medium text-black tracking-wide uppercase">Anganwadis</div>
                </div>
                <div className="w-px h-12 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
                <div className="text-center group">
                  <div className="text-3xl font-black text-black mb-1">10K+</div>
                  <div className="text-sm font-medium text-black tracking-wide uppercase">Children</div>
                </div>
                <div className="w-px h-12 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
                <div className="text-center group">
                  <div className="text-3xl font-black text-black mb-1">50+</div>
                  <div className="text-sm font-medium text-black tracking-wide uppercase">Districts</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Content - Hero Image/Illustration */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 border">
                {/* Dashboard Preview */}
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 hero-accent rounded-lg flex items-center justify-center">
                        <Baby className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold text-black">Dashboard</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-primary-600">125</div>
                      <div className="text-sm text-black">Total Children</div>
                    </div>
                    <div className="bg-primary-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-primary-600">98%</div>
                      <div className="text-sm text-black">Attendance</div>
                    </div>
                  </div>

                  {/* Chart Placeholder */}
                  <div className="bg-neutral-50 rounded-lg p-6 h-32 flex items-center justify-center">
                    <BarChart3 className="w-12 h-12 text-neutral-400" />
                  </div>

                  {/* Recent Activity */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-black">Recent Activity</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-2 bg-neutral-50 rounded">
                        <Users className="w-4 h-4 text-primary-500" />
                        <span className="text-sm text-black">New child registered</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-neutral-50 rounded">
                        <Heart className="w-4 h-4 text-primary-500" />
                        <span className="text-sm text-black">Health checkup completed</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-primary-400 rounded-full animate-bounce"></div>
                <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-secondary-400 rounded-full animate-pulse"></div>
              </div>
            </motion.div>
          </div>
        </div>


      </section>

      {/* Features Overview Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
              Everything You Need for
              <span className="text-gradient-combo block">Modern Anganwadi Management</span>
            </h2>
            <p className="text-lg text-black max-w-3xl mx-auto">
              Streamline operations, track child development, and engage families with our comprehensive platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Baby,
                title: "Child Development Tracking",
                description: "Monitor growth, health, and learning milestones with detailed records and analytics",
                color: "primary"
              },
              {
                icon: Users,
                title: "Family Engagement",
                description: "Connect with parents through updates, photos, and progress reports",
                color: "secondary"
              },
              {
                icon: Heart,
                title: "Health & Nutrition",
                description: "Track immunizations, health checkups, and nutrition programs",
                color: "primary"
              },
              {
                icon: BookOpen,
                title: "Learning Activities",
                description: "Plan and record educational activities and learning outcomes",
                color: "secondary"
              },
              {
                icon: BarChart3,
                title: "Reports & Analytics",
                description: "Generate comprehensive reports for government and stakeholders",
                color: "primary"
              },
              {
                icon: Shield,
                title: "Secure & Compliant",
                description: "Government-grade security with data privacy compliance",
                color: "secondary"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="card p-6 hover-lift group"
              >
                <div className={`w-12 h-12 bg-gradient-to-br from-${feature.color}-500 to-${feature.color}-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-black mb-3">{feature.title}</h3>
                <p className="text-black leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-padding bg-combo-gradient">
        <div className="container-custom">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: "500+", label: "Anganwadis", color: "primary" },
              { number: "10,000+", label: "Children", color: "primary" },
              { number: "50+", label: "Districts", color: "primary" },
              { number: "98%", label: "Satisfaction", color: "primary" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="card p-6"
              >
                <div className={`text-3xl md:text-4xl font-bold text-${stat.color}-600 mb-2`}>
                  {stat.number}
                </div>
                <div className="text-black font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Original Features Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-dark-900 mb-6 font-display">
              Everything You Need to Manage
              <br />
              <span className="text-gradient-combo">Anganwadis Effectively</span>
            </h2>
            <p className="text-xl text-dark-700 max-w-3xl mx-auto leading-relaxed">
              From child development tracking to family engagement, our comprehensive platform 
              covers every aspect of anganwadi management with professional tools and insights.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: index * 0.15, 
                  duration: 0.8,
                  type: "spring",
                  stiffness: 100
                }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -10, 
                  scale: 1.05,
                  rotateY: 5,
                  transition: { duration: 0.3 }
                }}
                className="card hover-glow p-8 group card-floating relative overflow-hidden"
                style={{ animationDelay: `${index * 0.5}s` }}
              >
                {/* Background gradient animation */}
                <div className={`absolute inset-0 bg-gradient-to-br ${
                  index % 2 === 0 
                    ? 'from-primary-50/50 to-secondary-50/30' 
                    : 'from-secondary-50/50 to-primary-50/30'
                } opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                <motion.div 
                  className={`w-14 h-14 bg-gradient-to-br ${
                    index % 2 === 0 
                      ? 'from-primary-500 to-primary-600' 
                      : 'from-secondary-500 to-secondary-600'
                  } rounded-xl flex items-center justify-center mb-6 shadow-lg relative z-10`}
                  whileHover={{ 
                    scale: 1.2, 
                    rotate: 360,
                    transition: { duration: 0.6 }
                  }}
                >
                  <feature.icon className="w-7 h-7 text-white icon-bouncing" />
                </motion.div>
                
                <h3 className={`text-xl font-bold mb-4 text-dark-900 ${
                  index % 2 === 0 
                    ? 'group-hover:text-primary-600' 
                    : 'group-hover:text-secondary-600'
                } transition-all duration-300 relative z-10`}>
                  {feature.title}
                </h3>
                <p className="text-dark-700 leading-relaxed relative z-10 group-hover:text-dark-800 transition-colors duration-300">
                  {feature.description}
                </p>
                
                {/* Decorative corner element */}
                <div className={`absolute top-4 right-4 w-2 h-2 ${
                  index % 2 === 0 ? 'bg-primary-400' : 'bg-secondary-400'
                } rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse`}></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted by Thousands Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <CheckCircle className="w-4 h-4" />
              <span>Trusted Nationwide</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-black mb-6">
              Trusted by <span className="bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">Thousands</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Join the growing community of anganwadi workers, coordinators, and government officials who trust SampoornaAngan for child development management.
            </p>
          </motion.div>

          {/* Statistics Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
          >
            {[
              { number: "10,000+", label: "Children Served", icon: Baby, color: "primary" },
              { number: "500+", label: "Anganwadis", icon: Users, color: "secondary" },
              { number: "50+", label: "Districts", icon: Shield, color: "primary" },
              { number: "99.9%", label: "Uptime", icon: TrendingUp, color: "secondary" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${
                  stat.color === 'primary' 
                    ? 'from-primary-500 to-primary-600' 
                    : 'from-secondary-500 to-secondary-600'
                } rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-black mb-2 group-hover:text-primary-600 transition-colors duration-300">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Government Partners */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <div className="text-center mb-12">
              <h3 className="text-2xl font-bold text-black mb-4">Trusted by Government Partners</h3>
              <p className="text-gray-600">Official partnerships with state governments and ICDS departments</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-center max-w-md mx-auto">
              {[
                { name: "Government of Kerala", abbr: "KL" },
                { name: "ICDS Department", abbr: "ICDS" }
              ].map((partner, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                  className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg transition-shadow duration-300 group"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:from-primary-50 group-hover:to-primary-100 transition-colors duration-300">
                    <span className="text-xl font-bold text-gray-600 group-hover:text-primary-600 transition-colors duration-300">
                      {partner.abbr}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-700 group-hover:text-black transition-colors duration-300">
                    {partner.name}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Testimonials */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className="text-center mb-12">
              <h3 className="text-2xl font-bold text-black mb-4">What Our Users Say</h3>
              <p className="text-gray-600">Real feedback from anganwadi workers and coordinators</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Priya Sharma",
                  role: "Anganwadi Worker, Pune",
                  content: "SampoornaAngan has completely transformed how we manage our center. The child tracking features are incredible and parents love the regular updates!",
                  rating: 5,
                  avatar: "PS"
                },
                {
                  name: "Dr. Rajesh Kumar",
                  role: "Block Coordinator, Mumbai",
                  content: "The reporting features help us track progress across all centers efficiently. Data collection has never been this easy and accurate.",
                  rating: 5,
                  avatar: "RK"
                },
                {
                  name: "Meera Devi",
                  role: "ASHA Volunteer, Nashik",
                  content: "Family engagement has improved significantly since we started using this system. Parents are more involved in their children's development.",
                  rating: 5,
                  avatar: "MD"
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2, duration: 0.6 }}
                  viewport={{ once: true }}
                  className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 group"
                >
                  {/* Rating Stars */}
                  <div className="flex mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  {/* Quote */}
                  <p className="text-gray-700 mb-6 italic leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  
                  {/* Author */}
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white font-semibold text-sm">{testimonial.avatar}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-black">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-8 bg-gray-50 rounded-2xl px-8 py-6">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Government Approved</span>
              </div>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">ISO Certified</span>
              </div>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-600" />
                <span className="text-sm font-medium text-gray-700">Child Safety First</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold font-display">
              Ready to Transform Your Anganwadi?
            </h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Join thousands of anganwadi workers who are already using SampoornaAngan 
              to provide better care for children and families.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-lg bg-white text-primary hover:bg-white/90"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </motion.button>
              </Link>
              <Link to="/contact">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-lg btn-outline border-white text-white hover:bg-white hover:text-primary"
                >
                  Contact Sales
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;