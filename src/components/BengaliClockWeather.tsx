import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, CloudSnow, Sun, Wind, Droplets } from 'lucide-react';
import { supabase } from '@/db/supabase';

interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  weather: {
    main: string;
    description: string;
    icon: string;
  }[];
  updated_at: string;
}

// বাংলা সংখ্যা রূপান্তর
const toBengaliNumber = (num: number): string => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).split('').map(d => bengaliDigits[parseInt(d)] || d).join('');
};

// বাংলা দিনের নাম
const bengaliDays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

// বাংলা মাসের নাম
const bengaliMonths = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

// আবহাওয়া বর্ণনা বাংলায়
const weatherDescriptionsBengali: Record<string, string> = {
  'clear sky': 'পরিষ্কার আকাশ',
  'few clouds': 'হালকা মেঘ',
  'scattered clouds': 'বিক্ষিপ্ত মেঘ',
  'broken clouds': 'আংশিক মেঘলা',
  'overcast clouds': 'ঘন মেঘলা',
  'light rain': 'হালকা বৃষ্টি',
  'moderate rain': 'মাঝারি বৃষ্টি',
  'heavy rain': 'ভারী বৃষ্টি',
  'thunderstorm': 'বজ্রঝড়',
  'snow': 'তুষারপাত',
  'mist': 'কুয়াশা',
  'fog': 'ঘন কুয়াশা',
  'haze': 'ধোঁয়াশা',
  'smoke': 'ধোঁয়া',
  'dust': 'ধূলিকণা',
  'sand': 'বালু',
  'ash': 'ছাই',
  'squall': 'ঝলকানি',
  'tornado': 'টর্নেডো',
  'clear': 'পরিষ্কার আকাশ',
  'clouds': 'মেঘলা',
};

const getWeatherIcon = (main: string) => {
  switch (main.toLowerCase()) {
    case 'clear': return <Sun className="w-8 h-8 text-yellow-500" />;
    case 'clouds': return <Cloud className="w-8 h-8 text-gray-400" />;
    case 'rain': 
    case 'drizzle': return <CloudRain className="w-8 h-8 text-blue-500" />;
    case 'thunderstorm': return <CloudRain className="w-8 h-8 text-indigo-600" />;
    case 'snow': return <CloudSnow className="w-8 h-8 text-blue-200" />;
    case 'mist':
    case 'fog':
    case 'haze': return <Wind className="w-8 h-8 text-gray-300" />;
    default: return <Wind className="w-8 h-8 text-gray-500" />;
  }
};

export const BengaliClockWeather: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    // আপডেট সময় প্রতি সেকেন্ডে
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // আবহাওয়া ডেটা লোড করুন
    const fetchWeather = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-weather');
        if (error) throw error;
        setWeather(data);
      } catch (err) {
        console.error('আবহাওয়া লোড করতে ব্যর্থ:', err);
      }
    };

    fetchWeather();
    // প্রতি ১০ মিনিটে আবহাওয়া আপডেট করুন
    const weatherInterval = setInterval(fetchWeather, 600000);

    return () => clearInterval(weatherInterval);
  }, []);

  // বাংলাদেশ সময় অনুযায়ী
  const bdTime = new Date(time.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
  
  const hour24 = bdTime.getHours();
  const hour12 = hour24 % 12 || 12; // Convert to 12-hour format
  const hours = toBengaliNumber(hour12);
  const minutes = toBengaliNumber(bdTime.getMinutes());
  const seconds = toBengaliNumber(bdTime.getSeconds());
  
  // সময়ের অংশ নির্ধারণ (সকাল/দুপুর/বিকাল/সন্ধ্যা/রাত)
  let timePeriod = '';
  if (hour24 >= 5 && hour24 < 12) {
    timePeriod = 'সকাল';
  } else if (hour24 >= 12 && hour24 < 15) {
    timePeriod = 'দুপুর';
  } else if (hour24 >= 15 && hour24 < 18) {
    timePeriod = 'বিকাল';
  } else if (hour24 >= 18 && hour24 < 20) {
    timePeriod = 'সন্ধ্যা';
  } else {
    timePeriod = 'রাত';
  }
  
  const dayName = bengaliDays[bdTime.getDay()];
  const date = toBengaliNumber(bdTime.getDate());
  const month = bengaliMonths[bdTime.getMonth()];
  const year = toBengaliNumber(bdTime.getFullYear());

  const weatherDesc = weather?.weather?.[0]
    ? (weatherDescriptionsBengali[weather.weather[0].description.toLowerCase()] || 
       weatherDescriptionsBengali[weather.weather[0].main.toLowerCase()] || 
       weather.weather[0].description)
    : '';

  return (
    <div className="w-full bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 backdrop-blur-md border-y border-primary/20 py-4">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* ডিজিটাল ঘড়ি */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-baseline gap-2 justify-center md:justify-start">
            <div className="text-4xl md:text-5xl font-black text-primary tracking-wider font-mono">
              {hours}:{minutes}:{seconds}
            </div>
            <div className="text-xl md:text-2xl font-bold text-primary/80">
              {timePeriod}
            </div>
          </div>
          <div className="text-sm md:text-base font-bold text-muted-foreground mt-1">
            {dayName}, {date} {month} {year}
          </div>
        </div>

        {/* আবহাওয়া */}
        {weather && weather.weather && weather.weather.length > 0 && (
          <div className="flex items-center gap-4 bg-card/50 backdrop-blur-sm px-6 py-3 rounded-2xl border border-primary/20">
            <div className="flex items-center gap-3">
              {getWeatherIcon(weather.weather[0].main || '')}
              <div>
                <div className="text-2xl font-black text-foreground">
                  {toBengaliNumber(Math.round(weather.temp))}°সে
                </div>
                <div className="text-xs text-muted-foreground font-bold">
                  টাঙ্গাইল • {weatherDesc}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Droplets className="w-4 h-4" />
              <span className="text-sm font-bold">{toBengaliNumber(weather.humidity)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
