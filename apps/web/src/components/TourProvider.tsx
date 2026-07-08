'use client';

import { useEffect, useState } from 'react';
import { Joyride, type Step } from 'react-joyride';
import { usePathname } from 'next/navigation';

export function TourProvider() {
  const pathname = usePathname();
  const [run, setRun] = useState(false);

  const steps: Step[] = [
    {
      target: 'nav[aria-label="Primary"]',
      content: 'Navigate between the Dashboard, Video Calls, and Sign Practice here.',
      placement: 'right',
    },
    {
      target: '[aria-labelledby="hero-heading"]',
      content: 'Start a Live Conversation instantly with this quick action.',
      placement: 'bottom',
    },
    {
      target: '#modules-heading',
      content:
        'Access all SignBridge modules here, including Avatar translation and ML Model training.',
      placement: 'top',
    },
  ];

  useEffect(() => {
    // Only run if the user just registered and landed on the dashboard
    if (pathname === '/dashboard') {
      const needsTour = localStorage.getItem('signbridge_needs_tour');
      if (needsTour === 'true') {
        // Wait briefly for dashboard to render before showing tour
        setTimeout(() => {
          setRun(true);
          // Consume the flag immediately so it never runs again,
          // even if the user refreshes or closes the tab without finishing.
          localStorage.removeItem('signbridge_needs_tour');
        }, 500);
      }
    }
  }, [pathname]);

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses = ['finished', 'skipped'];
    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.removeItem('signbridge_needs_tour');
    }
  };

  return <Joyride steps={steps} run={run} continuous callback={handleJoyrideCallback} />;
}
