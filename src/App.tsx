import { Routes, Route } from 'react-router-dom';
import { EntryScreen } from './features/mydata/screens/EntryScreen';
import { ConsentScreen } from './features/mydata/screens/ConsentScreen';
import { MydataConnectionScreen } from './features/mydata/screens/MydataConnectionScreen';
import { AssetOverviewScreen } from './features/mydata/screens/AssetOverviewScreen';
import { InvestmentProfilePlaceholderScreen } from './features/mydata/screens/InvestmentProfilePlaceholderScreen';
import { SurveyScreen } from './features/investmentSurvey/screens/SurveyScreen';

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-stretch bg-slate-100 sm:items-center sm:py-10">
      <div className="flex w-full flex-1 flex-col overflow-hidden bg-white sm:w-[390px] sm:flex-none sm:min-h-[931.333px] sm:rounded-[32px] sm:border sm:border-slate-300 sm:shadow-xl">
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<PhoneFrame><EntryScreen /></PhoneFrame>} />
      <Route path="/mydata/consent" element={<PhoneFrame><ConsentScreen /></PhoneFrame>} />
      <Route path="/mydata/connect" element={<MydataConnectionScreen />} />
      <Route path="/mydata/report" element={<PhoneFrame><AssetOverviewScreen /></PhoneFrame>} />
      <Route path="/mydata/survey" element={<PhoneFrame><SurveyScreen /></PhoneFrame>} />
      <Route
        path="/mydata/investment-profile"
        element={<PhoneFrame><InvestmentProfilePlaceholderScreen /></PhoneFrame>}
      />
    </Routes>
  );
}

export default App;
