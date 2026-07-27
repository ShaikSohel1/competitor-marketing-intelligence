export interface VoiceCommandMatch {
  isCommand: boolean;
  route?: string;
  actionName?: string;
  feedbackMessage?: string;
}

export function parseVoiceCommand(
  text: string,
  callbacks?: {
    onScanCompetitors?: () => void;
  }
): VoiceCommandMatch {
  const norm = text.toLowerCase().trim();

  if (norm.includes('compare us with amazon') || norm.includes('compare with amazon')) {
    return {
      isCommand: true,
      route: '/app/comparison',
      feedbackMessage: 'Opening head-to-head Amazon comparison dashboard...',
    };
  }

  if (norm.includes('compare us with lenskart') || norm.includes('compare with lenskart')) {
    return {
      isCommand: true,
      route: '/app/comparison',
      feedbackMessage: 'Opening head-to-head Lenskart comparison dashboard...',
    };
  }

  if (norm.includes('show seo') || norm.includes('open seo') || norm.includes('seo rankings')) {
    return {
      isCommand: true,
      route: '/app/seo',
      feedbackMessage: 'Opening SEO & Keyword Intelligence view...',
    };
  }

  if (norm.includes('open pricing') || norm.includes('show pricing') || norm.includes('pricing comparison')) {
    return {
      isCommand: true,
      route: '/app/pricing',
      feedbackMessage: 'Opening Pricing Intelligence page...',
    };
  }

  if (norm.includes('show dashboard') || norm.includes('open dashboard') || norm.includes('go to dashboard')) {
    return {
      isCommand: true,
      route: '/app/dashboard',
      feedbackMessage: 'Navigating to Dashboard...',
    };
  }

  if (norm.includes('generate swot') || norm.includes('show insights') || norm.includes('ai insights')) {
    return {
      isCommand: true,
      route: '/app/insights',
      feedbackMessage: 'Opening AI Insights & SWOT analysis...',
    };
  }

  if (norm.includes('generate report') || norm.includes('open reports') || norm.includes('show reports')) {
    return {
      isCommand: true,
      route: '/app/reports',
      feedbackMessage: 'Opening Competitor Intelligence Reports...',
    };
  }

  if (norm.includes('open my company') || norm.includes('show my company') || norm.includes('company profile')) {
    return {
      isCommand: true,
      route: '/app/company',
      feedbackMessage: 'Opening My Company Overview page...',
    };
  }

  if (norm.includes('show website changes') || norm.includes('open website')) {
    return {
      isCommand: true,
      route: '/app/website',
      feedbackMessage: 'Opening Website Monitoring tab...',
    };
  }

  if (norm.includes('show alerts') || norm.includes('open alerts')) {
    return {
      isCommand: true,
      route: '/app/alerts',
      feedbackMessage: 'Opening Competitor Alerts view...',
    };
  }

  if (norm.includes('scan competitors') || norm.includes('run scan')) {
    callbacks?.onScanCompetitors?.();
    return {
      isCommand: true,
      actionName: 'scan',
      feedbackMessage: 'Triggering competitor intelligence scan...',
    };
  }

  return { isCommand: false };
}
