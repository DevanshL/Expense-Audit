import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Zap, Lock, Brain, CheckCircle2, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans selection:bg-brand-primary/30 selection:text-brand-primary">
      {/* Navigation */}
      <nav className="absolute top-0 w-full z-50 px-6 py-4 flex justify-between items-center text-white">
        <div className="flex items-center space-x-2">
          <Shield className="w-8 h-8 text-brand-primary" />
          <span className="text-xl font-bold tracking-tight">ExpenseAudit AI</span>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Link to="/login" className="px-5 py-2 rounded-lg font-medium text-gray-300 hover:text-white transition-colors">
            Login
          </Link>
          <Link to="/signup" className="px-5 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg font-medium transition-colors shadow-lg shadow-brand-primary/25">
            Try ExpenseAudit free →
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-brand-dark">
        {/* Animated Background Mesh Gradient */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-purple/20 blur-[120px] mix-blend-screen animate-blob"></div>
          <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-primary/20 blur-[120px] mix-blend-screen animate-blob animation-delay-200"></div>
          <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-brand-pink/20 blur-[120px] mix-blend-screen animate-blob animation-delay-400"></div>
          
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial="hidden" 
              animate="visible" 
              variants={staggerContainer}
              className="text-left"
            >
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-brand-purple mb-6 text-sm font-medium">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
                </span>
                ExpenseAudit AI 2.0 is live
              </motion.div>
              <motion.h1 variants={fadeIn} className="text-5xl lg:text-7xl font-bold text-white tracking-tight leading-loose mb-6">
                Audit expenses instantly with <br className="hidden lg:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-purple to-brand-pink">
                  AI precision.
                </span>
              </motion.h1>
              <motion.p variants={fadeIn} className="text-lg lg:text-xl text-gray-400 mb-8 max-w-xl leading-relaxed">
                Enterprise-grade fraud detection, Benford's Law analysis, and persistent AI chat designed to keep your finances secure and perfectly organized.
              </motion.p>
              <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup" className="px-8 py-4 bg-white text-brand-dark hover:bg-gray-100 rounded-lg font-bold text-lg text-center transition-all shadow-xl flex items-center justify-center gap-2">
                  Try ExpenseAudit free <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/login" className="px-8 py-4 bg-white/5 text-white hover:bg-white/10 border border-white/10 rounded-lg font-medium text-lg text-center transition-all flex items-center justify-center">
                  View Demo
                </Link>
              </motion.div>
            </motion.div>

            {/* High-Fidelity Realistic UI Mockup Box matching user screenshot */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
              className="relative hidden lg:block perspective-1000"
            >
              <motion.div 
                animate={{ y: [-10, 10, -10] }} 
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="w-full h-[460px] bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200/50 flex flex-col z-10"
                style={{ transform: "rotateY(-5deg) rotateX(5deg)" }}
              >
                 {/* Traffic Lights Header */}
                 <div className="h-12 border-b border-gray-100 flex items-center px-4 justify-between bg-white w-full">
                    <div className="flex gap-2 items-center">
                       <div className="w-3 h-3 rounded-full bg-red-400"></div>
                       <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                       <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="h-4 w-48 bg-gray-100 rounded-full"></div>
                    <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center bg-gray-50">
                       <div className="w-3 h-3 rounded-full bg-brand-primary/80"></div>
                    </div>
                 </div>

                 {/* Body */}
                 <div className="flex-1 flex p-5 gap-6 bg-[#FaFbfc]">
                    {/* Sidebar */}
                    <div className="w-1/3 flex flex-col gap-4">
                       <div className="h-32 w-full bg-[#f4f7fb] rounded-xl border border-brand-primary/10 flex flex-col items-center justify-center p-4 relative">
                          <Zap className="w-10 h-10 text-brand-primary mb-3 stroke-2" />
                          <div className="h-2 w-16 bg-brand-primary/30 rounded-full"></div>
                          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary to-brand-teal"></div>
                       </div>
                       
                       <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                          <div className="h-2 w-20 bg-gray-200 rounded-full mb-4"></div>
                          <div className="space-y-3">
                             <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden"><div className="w-3/4 h-full bg-brand-primary"></div></div>
                             <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden"><div className="w-1/2 h-full bg-brand-teal"></div></div>
                             <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden"><div className="w-5/6 h-full bg-brand-yellow"></div></div>
                          </div>
                       </div>
                    </div>

                    {/* Main Content / Chat */}
                    <div className="w-2/3 bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col relative">
                       <div className="h-3 w-32 bg-gray-200 rounded-full mb-8"></div>
                       
                       <div className="flex flex-col gap-5 flex-1">
                          {/* User Message */}
                          <div className="self-end max-w-[85%] bg-brand-primary text-white p-3.5 rounded-2xl rounded-tr-sm shadow-sm">
                             <p className="text-[13px] font-medium leading-relaxed opacity-95">Analyze the Q3 marketing dataset. Find any duplicate vendor payments over $5,000.</p>
                          </div>
                          
                          {/* AI Response containing analysis text */}
                          <div className="self-start max-w-[95%] bg-brand-primary/5 border border-brand-primary/10 p-4 rounded-2xl rounded-tl-sm flex gap-3">
                             <div className="w-8 h-8 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center flex-shrink-0">
                                <Brain className="w-4 h-4 text-brand-purple" />
                             </div>
                             <div className="flex-1">
                                <p className="text-[13px] text-gray-700 font-medium mb-2">Analysis complete. I found 2 anomalies:</p>
                                <div className="space-y-2 mb-3">
                                  <div className="h-2 w-full bg-brand-primary/20 rounded-full"></div>
                                  <div className="h-2 w-5/6 bg-brand-primary/20 rounded-full"></div>
                                </div>
                                <div className="bg-white border border-gray-100 rounded p-2 text-[11px] text-gray-600 font-mono shadow-sm">
                                  Duplicate detected: Google Ads <br/> Inv #9928 — $8,450.00
                                </div>
                             </div>
                          </div>
                       </div>

                       {/* Input Area */}
                       <div className="mt-4 h-12 w-full bg-gray-50 border border-gray-200 rounded-xl flex items-center px-4 gap-3">
                          <div className="h-4 w-4 rounded border border-gray-300 bg-white"></div>
                          <p className="text-gray-400 text-[13px]">Ask a follow up question...</p>
                          <div className="ml-auto w-7 h-7 rounded bg-brand-primary/10 flex items-center justify-center">
                             <ArrowRight className="w-3.5 h-3.5 text-brand-primary"/>
                          </div>
                       </div>
                    </div>
                 </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Intelligence built <span className="relative inline-block text-brand-primary">directly</span> into your workflow
            </h2>
            <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              We replace complex auditing spreadsheets with an automated, AI-driven engine.
            </p>
          </div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { 
                icon: Zap, 
                title: 'Benford Analysis', 
                desc: 'Instantly run mathematical models against thousands of transactions to highlight extreme anomalies.' 
              },
              { 
                icon: Brain, 
                title: 'Persistent AI Chat', 
                desc: 'Ask questions about your data. The AI remembers your audit context across sessions seamlessly.' 
              },
              { 
                icon: Lock, 
                title: 'Bank-Grade Security', 
                desc: 'Your financial data is encrypted and completely isolated. Generate deep trend reports safely.' 
              }
            ].map((feature, i) => (
              <motion.div key={i} variants={fadeIn} className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="w-14 h-14 bg-brand-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-brand-primary" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-24 bg-gray-50 dark:bg-gray-800 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Choose <span className="text-brand-primary relative z-10">Your Plan</span>
            </h2>
            <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Whether you are an independent auditor or managing an enterprise team, we have the right tools.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col"
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Free</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-black text-gray-900 dark:text-white">$0</span>
                <span className="text-gray-500 font-medium">/ forever</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-8 border-b border-gray-100 dark:border-gray-800 pb-8">
                Perfect for individuals testing out the platform.
              </p>
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  '10 Document uploads per month',
                  'Standard Benford\'s Law Charts',
                  'Basic AI Context',
                  'Export to CSV/PDF'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="w-full py-4 px-6 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl text-center transition-colors">
                Get Started Free
              </Link>
            </motion.div>

            {/* Pro Tier */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-brand-dark rounded-3xl p-8 border border-brand-primary/30 shadow-2xl shadow-brand-primary/20 flex flex-col relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-brand-purple/10 pointer-events-none"></div>
              
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-primary opacity-20 blur-2xl rounded-full"></div>

              <div className="relative z-10">
                <div className="inline-flex px-3 py-1 rounded-full bg-brand-primary/20 text-brand-primary font-semibold text-sm w-max mb-6">
                  Most Popular
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Professional</h3>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-5xl font-black text-white">$15</span>
                  <span className="text-gray-400 font-medium">/ month</span>
                </div>
                <p className="text-gray-300 mb-8 border-b border-white/10 pb-8">
                  Unlocks the full power of persistent AI memory and deep reporting.
                </p>
                <ul className="space-y-4 mb-8 flex-1">
                  {[
                    'Unlimited document uploads',
                    'Persistent AI Chat Memory',
                    'Deep AI Trend Reports & Forecasting',
                    'Premium Models (Gemini Flash / Llama 3)',
                    'Priority Support'
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-300">
                      <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className="w-full py-4 px-6 bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold rounded-xl text-center transition-colors shadow-lg">
                  Upgrade to Pro
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-brand-dark border-t border-white/10 py-12 text-center text-gray-400">
        <div className="flex items-center justify-center gap-2 mb-4">
           <Shield className="w-6 h-6 text-brand-primary"/>
           <span className="font-bold text-white text-xl">ExpenseAudit AI</span>
        </div>
        <p>© 2026 ExpenseAudit AI. Built for modern financial teams.</p>
      </footer>
    </div>
  );
}
