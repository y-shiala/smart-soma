import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Camera, Mic, Pencil, Sparkles, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navbar } from '@/components/Navbar';

const Home = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const features = [
    {
      icon: Camera,
      title: language === 'en' ? 'Scan Homework' : 'Changanua Kazi',
      description: language === 'en' 
        ? 'Take a photo of your homework and get instant help' 
        : 'Piga picha ya kazi yako na upate msaada papo hapo',
    },
    {
      icon: Mic,
      title: language === 'en' ? 'Ask by Voice' : 'Uliza kwa Sauti',
      description: language === 'en' 
        ? 'Speak your question and receive clear explanations' 
        : 'Sema swali lako na upokee maelezo wazi',
    },
    {
      icon: Pencil,
      title: language === 'en' ? 'Type Questions' : 'Andika Maswali',
      description: language === 'en' 
        ? 'Type your homework questions for step-by-step solutions' 
        : 'Andika maswali yako ya kazi kwa ufumbuzi wa hatua kwa hatua',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="container px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">
              {language === 'en' ? 'AI-Powered Learning' : 'Kujifunza kwa AI'}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            {language === 'en' 
              ? 'Your Smart Homework Helper' 
              : 'Msaidizi Wako wa Kazi za Nyumbani'}
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {language === 'en'
              ? 'Get instant, step-by-step explanations for your homework. Designed for Kenyan students following CBC.'
              : 'Pata maelezo ya papo hapo, hatua kwa hatua kwa kazi yako. Imeundwa kwa wanafunzi wa Kenya wanaofuata mtaala wa CBC.'}
          </p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <Button 
              size="lg" 
              onClick={() => navigate('/learn')}
              className="text-lg px-8 py-6 rounded-xl"
            >
              <GraduationCap className="w-5 h-5 mr-2" />
              {language === 'en' ? 'Start Learning' : 'Anza Kujifunza'}
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container px-4 py-16 bg-muted/30">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-foreground mb-4">
            {language === 'en' ? 'How It Works' : 'Jinsi Inavyofanya Kazi'}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {language === 'en'
              ? 'Three easy ways to get help with your homework'
              : 'Njia tatu rahisi za kupata msaada na kazi yako'}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow border-border/50">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-primary text-primary-foreground overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                {language === 'en' 
                  ? 'Ready to ace your homework?' 
                  : 'Uko tayari kufaulu kazi yako?'}
              </h2>
              <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
                {language === 'en'
                  ? 'Join thousands of Kenyan students getting better grades with Soma Smart.'
                  : 'Jiunge na maelfu ya wanafunzi wa Kenya wanaopata alama bora na Soma Smart.'}
              </p>
              <Button 
                variant="secondary" 
                size="lg"
                onClick={() => navigate('/learn')}
                className="rounded-xl"
              >
                {language === 'en' ? 'Get Started Free' : 'Anza Bure'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 pb-24 sm:pb-8">
        <div className="container px-4 text-center text-muted-foreground text-sm">
          <p>© 2024 Soma Smart. {language === 'en' ? 'All rights reserved.' : 'Haki zote zimehifadhiwa.'}</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
