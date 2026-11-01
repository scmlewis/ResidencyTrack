import React from 'react';
import { Github, User, ExternalLink } from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white dark:bg-[#111C38] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">About ResidencyTrack</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          ResidencyTrack is an independent, local-first web application that helps British National (Overseas) (BN(O))
          visa holders plan and monitor overseas absences against UK immigration compliance rules on the 5-year route to
          Indefinite Leave to Remain (ILR) and British citizenship.
        </p>
      </div>

      <div className="bg-white dark:bg-[#111C38] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-teal-500" /> Creator
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Created by <span className="font-semibold text-slate-900 dark:text-slate-100">Lewis</span> (GitHub:
          <a
            href="https://github.com/scmlewis"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
          >
            @scmlewis <ExternalLink className="w-3 h-3" />
          </a>
          ).
        </p>
      </div>

      <div className="bg-white dark:bg-[#111C38] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <Github className="w-4 h-4 text-teal-500" /> Source code
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
          The full source code is open on GitHub. Issues, suggestions and pull requests are welcome.
        </p>
        <a
          href="https://github.com/scmlewis/ResidencyTrack"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 rounded-lg transition-colors"
        >
          <Github className="w-4 h-4" /> github.com/scmlewis/ResidencyTrack
        </a>
      </div>

      <div className="bg-white dark:bg-[#111C38] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">Disclaimer</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          ResidencyTrack is an independent planning aid. It is not affiliated with the UK Home Office and does not
          constitute immigration or legal advice. Statutory rules may change — always confirm current requirements on
          <a href="https://www.gov.uk" target="_blank" rel="noopener noreferrer" className="text-teal-600 dark:text-teal-400 hover:underline ml-1">
            gov.uk
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default AboutView;
