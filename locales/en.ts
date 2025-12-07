export default {
  // Navigation
  nav: {
    dashboard: 'Dashboard',
    checkin: 'Check-in',
    classes: 'Classes',
    membership: 'Membership',
    billing: 'Billing',
    settings: 'Settings',
  },

  // Common
  common: {
    close: 'Close',
    back: 'Back',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    retry: 'Retry',
    tryAgain: 'Try Again',
    viewPlans: 'View Plans',
    logout: 'Logout',
  },

  // Home/Dashboard Screen
  home: {
    welcomeBack: 'Welcome back!',
    goodMorning: 'Good morning!',
    goodAfternoon: 'Good afternoon!',
    goodEvening: 'Good evening!',
    membershipStatus: 'Membership Status',
    activeMember: 'Active Member',
    classesLeft: 'Classes Left',
    unlimited: 'Unlimited',
    nextBilling: 'Next Billing',
    memberSince: 'Member Since',
    classes: 'Classes',
    checkins: 'Check-ins',
    thisMonth: 'this month',
    thisWeek: 'this week',
    lastSevenDays: 'Last 7 days',
    goalProgress: 'Goal Progress',
    monthly: 'Monthly',
    weeklyActivity: 'Weekly Activity',
    pastThreeWeeks: 'Past 3 weeks',
    onTrack: 'on track',
  },

  // Settings Screen
  settings: {
    title: 'Settings',
    profile: 'Profile',
    currentPlan: 'Current plan',
    classesThisMonth: 'Classes this month',
    upgradeMembership: 'Upgrade Membership',
    unlockUnlimitedClasses: 'Unlock unlimited classes',
    editProfile: 'Edit Profile',
    updatePersonalInfo: 'Update your personal information',
    membership: 'Membership',
    manageSubscription: 'Manage your subscription',
    notifications: 'Notifications',
    classRemindersAndUpdates: 'Class reminders & updates',
    helpAndSupport: 'Help & Support',
    getHelp: 'Get help with your account',
    logout: 'Logout',
    signOut: 'Sign out of your account',
  },

  // Memberships Screen
  memberships: {
    title: 'Membership Plans',
    chooseYourPlan: 'Choose your plan',
    flexibleOptions: 'Flexible membership options for your fitness journey',
    allPlansInclude: 'All plans include access to our state-of-the-art facilities',
    selectPlan: 'Select {{plan}} Plan',
    whatsIncluded: "WHAT'S INCLUDED",
    perMonth: '/month',
    off: 'off',

    // Plan names
    basic: 'Basic',
    monthlyPremium: 'Monthly Premium',
    annualPremium: 'Annual Premium',

    // Plan descriptions
    basicDescription: 'Perfect for getting started',
    monthlyDescription: 'Most popular for dedicated members',
    annualDescription: 'Best value for committed athletes',

    // Features
    gymFloorAccess: 'Access to gym floor',
    groupClasses: '{{count}} group classes per month',
    unlimitedGymAccess: 'Unlimited gym access',
    unlimitedGroupClasses: 'Unlimited group classes',
    basicEquipment: 'Basic equipment',
    lockerAccess: 'Locker access',
    premiumLocker: 'Premium locker',
    personalTrainingSession: 'Personal training session',
    personalTrainingSessions: '{{count}} personal training sessions',
    guestPasses: 'Guest passes ({{count}}/month)',
    allPremiumFeatures: 'All Premium features',
    nutritionConsultation: 'Nutrition consultation',
    freeMerchandise: 'Free merchandise',
    priorityClassBooking: 'Priority class booking',
  },

  // Check-in Screen
  checkin: {
    title: 'Scan QR Code',
    permissionRequired: 'Camera Permission Required',
    grantPermission: 'Grant Permission',
    permissionMessage: 'Please grant camera access to scan QR codes for check-in',
    requestingPermission: 'Requesting camera permission...',
    goBack: 'Go Back',
    pointCameraAtQR: 'Point camera at QR code',
    alignQRCode: 'Align the QR code within the frame',
    checkingIn: 'Checking in...',
    checkInSuccess: 'Check-in Success!',
    welcomeBack: 'Welcome back, {{name}}!',
    checkInNumber: 'Check-in #{{count}} this month',
    keepUpStreak: 'Keep up the streak!',

    // Errors
    invalidQRCode: 'Invalid QR code',
    alreadyCheckedIn: "You're already checked in",
    membershipInactive: 'Your membership is inactive.\nPlease contact the front desk.',
    checkInFailed: 'Check-in failed',
    networkError: 'Network error. Please try again.',
  },

  // Login Screen
  login: {
    title: 'Login',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    login: 'Login',
    noAccount: "Don't have an account?",
    signUp: 'Sign up',

    // Validation
    emailRequired: 'Email is required',
    invalidEmail: 'Please enter a valid email',
    passwordRequired: 'Password is required',
    passwordTooShort: 'Password must be at least 6 characters',
    loginFailed: 'Login failed. Please check your credentials.',
  },

  // Membership Screen
  membership: {
    title: 'My Membership',
    currentPlan: 'Current Plan',
    memberId: 'Member ID',
    membershipId: 'Membership ID',
    members: 'Members',
    contractId: 'Contract ID',
    contractDetails: 'Contract Details',
    startDate: 'Start Date',
    endDate: 'End Date',
    renewalDate: 'Renewal Date',
    nextCancellationDate: 'Next Cancellation Date',
    autoRenewal: 'Auto-Renewal',
    enabled: 'Enabled',
    disabled: 'Disabled',
    pricing: 'Pricing',
    annualFee: 'Annual Fee',
    monthlyFee: 'Monthly Fee',
    monthlyEquivalent: 'Monthly Equivalent',
    billedAnnually: 'Billed annually',
    billedMonthly: 'Billed monthly',
    billedWeekly: 'Billed weekly',
    contractDuration: 'Contract Duration',
    perMonth: '/mo',
    planFeatures: 'Plan Features',
    limit: 'Limit',
    paymentMethod: 'Payment Method',
    accountHolder: 'Account Holder',
    policies: 'Membership Policies',
    cancellationPolicy: 'Cancellation Policy',
    freezePolicy: 'Freeze Policy',
    transferPolicy: 'Transfer Policy',
    downloadContract: 'Download Contract PDF',
    cancelMembership: 'Cancel Membership',
    noMembership: 'No membership found',
    supportMessage: 'For questions about your membership, please contact support@omoplata.com',

    // Download messages
    contractPdfTitle: 'Contract PDF',
    contractDownloadMessage: 'Contract would be downloaded from: {{url}}',
    downloadError: 'Failed to download contract PDF',

    // Policy details
    daysNoticeRequired: '{{count}} days notice required',
    upTo: 'Up to',
    daysPerYear: '{{count}} days per year',
    defaultCancellationPolicy: 'Contact support for cancellation details',
    defaultFreezePolicy: 'Freeze available upon request',
    defaultTransferPolicy: 'Memberships are non-transferable',

    // Status
    new: 'New',
    onboardingStarted: 'Onboarding Started',
    active: 'Active',
    paused: 'Paused',
    cancelled: 'Cancelled',
    defaulted: 'Defaulted',

    // Status descriptions
    newDescription: 'Membership created, awaiting onboarding',
    onboardingStartedDescription: 'Onboarding in progress',
    activeDescription: 'Active membership',
    pausedDescription: 'Membership temporarily paused',
    cancelledDescription: 'Membership cancelled',
    defaultedDescription: 'Payment default - please contact support',

    // Document requests
    documentRequests: 'Document Requests',
    pendingDocuments: 'Pending Documents',
    documentRequired: 'Document Required',
    uploadDocument: 'Upload Document',
    uploading: 'Uploading...',
    uploadSuccess: 'Document uploaded successfully',
    uploadError: 'Failed to upload document',
    selectFile: 'Select File',
    takePhoto: 'Take Photo',
    chooseFromLibrary: 'Choose from Library',

    // Document types
    documentTypes: {
      studentProof: 'Student ID',
      idCard: 'ID Card',
      passport: 'Passport',
      proofOfAddress: 'Proof of Address',
      medicalCertificate: 'Medical Certificate',
      other: 'Other Document',
    },
  },

  // Billing Screen
  billing: {
    title: 'Billing',
    nextInvoice: 'Next Invoice',
    due: 'Due',
    viewDetails: 'View Details',
    recentInvoices: 'Recent Invoices',
    paymentMethod: 'Payment Method',
    sepaDirectDebit: 'SEPA Direct Debit',
    edit: 'Edit',
    loadMore: 'Load More',
    errorTitle: 'Unable to load invoices',

    // Invoice status
    paid: 'Paid',
    pending: 'Pending',
    overdue: 'Overdue',
  },

  // SEPA Form
  sepaForm: {
    title: 'Set Up Direct Debit',
    subtitle: 'Add your bank details to enable automatic payments',
    accountHolder: 'Account Holder',
    accountHolderPlaceholder: 'Full name as shown on account',
    iban: 'IBAN',
    ibanPlaceholder: 'DE89 3704 0044 0532 0130 00',
    bic: 'BIC/SWIFT (optional)',
    bicPlaceholder: 'COBADEFFXXX',
    mandateText:
      'By providing your IBAN, you authorize us to send instructions to your bank to debit your account in accordance with those instructions.',
    submitButton: 'Set Up Direct Debit',
    submitting: 'Setting up...',
    successMessage: 'Direct debit set up successfully',
    errorMessage: 'Failed to set up direct debit. Please try again.',
    invalidIban: 'Please enter a valid IBAN',
    invalidAccountHolder: 'Please enter the account holder name',
  },

  // Classes Screen
  classes: {
    title: 'All Classes',
    filters: 'Filters',
    clearFilters: 'Clear All',
    category: 'Category',
    level: 'Level',
    instructor: 'Instructor',
    location: 'Location',
    showingResults: 'Showing {{count}} of {{total}} classes',
    loadMore: 'Load More Classes',
    noClassesFound: 'No Classes Found',
    tryDifferentFilters: 'Try adjusting your filters',
    errorTitle: 'Unable to load classes',
  },

  // Calendar Screen
  calendar: {
    title: 'Class Calendar',
    legend: 'Class Categories',
    noClasses: 'No classes scheduled for this day',
    errorTitle: 'Unable to load classes',
    today: 'Today',
    scheduled: 'scheduled',
    classCount: {
      one: 'class',
      other: 'classes',
    },
  },

  // Frequencies / Durations (ISO 8601)
  frequency: {
    // Recurring intervals (for charge_interval)
    recurring: {
      P1D: 'daily',
      P1W: 'weekly',
      P2W: 'every 2 weeks',
      P1M: 'monthly',
      P3M: 'every 3 months',
      P6M: 'every 6 months',
      P12M: 'every 12 months',
      P18M: 'every 18 months',
      P24M: 'every 24 months',
      P1Y: 'yearly',
    },
    // One-time durations (for contract_duration)
    once: {
      P1W: '1 week',
      P1M: '1 month',
      P2M: '2 months',
      P3M: '3 months',
      P6M: '6 months',
      P12M: '12 months',
      P18M: '18 months',
      P24M: '24 months',
      P1Y: '1 year',
      P2Y: '2 years',
    },
  },

  // Club Not Found
  clubNotFound: {
    title: 'Club Not Found',
    message:
      "We couldn't find this club. The club may have been removed or the link you used may be incorrect.",
    suggestions: 'What you can try:',
    checkUrl: 'Check that the club URL or code is correct',
    contactClub: 'Contact your club directly to verify their details',
    tryLater: 'Try again later in case of a temporary issue',
    selectDifferentClub: 'Select a Different Club',
  },

  // Date/Time
  date: {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',

    january: 'January',
    february: 'February',
    march: 'March',
    april: 'April',
    may: 'May',
    june: 'June',
    july: 'July',
    august: 'August',
    september: 'September',
    october: 'October',
    november: 'November',
    december: 'December',
  },
};
