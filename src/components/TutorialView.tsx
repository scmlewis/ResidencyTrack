import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

const steps = [
  { title: 'Set up your Immigration Profile', body: 'Open "Immigration Profile" and enter your first UK arrival date and qualifying period start date. This anchors all calculations.' },
  { title: 'Log your overseas trips', body: 'Use "Log Overseas Trip" to record each departure and return, with destination, purpose and status (planned / ongoing / completed).' },
  { title: 'Review the Compliance Dashboard', body: 'See rolling 180-day ILR limits and naturalisation progression at a glance.' },
  { title: 'Deep-dive in Absence Analytics', body: 'Get the mathematical breakdown of continuous residence and final-year limits.' },
  { title: 'Use the Interactive Calendar', body: 'Visually map UK presence, overseas travel and milestones month by month.' },
  { title: 'Check the Immigration Timeline', body: 'View five-year milestones and earliest settlement eligibility.' },
  { title: 'Simulate before you book', body: 'Use the Travel Impact Simulator to test proposed flights and see absence impact in real time.' },
  { title: 'Back up your data', body: 'Export JSON/CSV from Settings so you never lose your records (data lives in your browser).' },
];

export const TutorialView: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white dark:bg-[#111C38] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Tutorial & Onboarding</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Follow these steps to get started with ResidencyTrack. You can revisit any section anytime from the navigation.
        </p>
      </div>

      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="bg-white dark:bg-[#111C38] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
              {i + 1}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-500" /> {s.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-5 flex items-start gap-3">
        <ArrowRight className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
        <p className="text-sm text-teal-800 dark:text-teal-200">
          Tip: start with your Immigration Profile, then log a few trips — the Dashboard and Analytics will populate automatically.
        </p>
      </div>
    </div>
  );
};

export default TutorialView;
EOF
echo done