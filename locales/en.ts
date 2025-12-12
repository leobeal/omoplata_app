export default {
  // Navigation
  nav: {
    dashboard: 'Dashboard',
    checkin: 'Check-in',
    classes: 'Classes',
    leaderboard: 'Leaderboard',
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
    continue: 'Continue',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    reset: 'Reset',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    retry: 'Retry',
    tryAgain: 'Try Again',
    viewPlans: 'View Plans',
    logout: 'Logout',
  },

  // Onboarding Slides
  onboarding: {
    slide1: {
      title: 'Train Smarter',
      description: 'Book classes, track attendance, and stay on top of your training schedule',
    },
    slide2: {
      title: 'Stay Connected',
      description: 'Get notified about upcoming classes and never miss a session',
    },
    slide3: {
      title: 'Reach Your Goals',
      description: 'Monitor your progress and achieve your fitness targets',
    },
  },

  // Tenant Selection
  tenantSelection: {
    title: 'Find Your Gym',
    subtitle: 'Enter your gym identifier to get started',
    label: 'Gym Identifier',
    placeholder: 'e.g., evolve',
    help: 'Ask your gym for the identifier',
    errors: {
      required: 'Please enter your gym identifier',
      invalid: 'Only lowercase letters, numbers, and hyphens allowed',
      tooShort: 'Identifier must be at least 2 characters',
      failed: 'Failed to connect. Please try again.',
    },
  },

  // Network
  network: {
    offline: "You're offline",
    offlineMessage: 'Changes will sync when connection is restored',
    backOnline: 'Back online',
    usingCachedData: 'Showing cached data',
  },

  // Family / Profile Switching
  family: {
    title: 'Family Members',
    viewingAs: "Viewing as {{name}}'s account",
    switchBack: 'Switch back',
    switchBackTo: 'Switch back to your account',
    switchAccount: 'Switch Account',
    tapToView: 'Tap to view their account',
    view: 'View',
    switch: 'Switch',
    switchError: 'Failed to switch account',
    switchBackError: 'Failed to switch back to your account',
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
    last6Weeks: 'Last 6 weeks',
    lastSevenDays: 'Last 7 days',
    goalProgress: 'Goal Progress',
    monthly: 'Monthly',
    weeklyActivity: 'Weekly Activity',
    pastThreeWeeks: 'Past 3 weeks',
    onTrack: 'on track',
    total: 'total',
    streak: 'Streak',
    currentStreak: 'Current streak',
    weeks: 'weeks',
    week: 'week',
    best: 'Best',
    upcomingClasses: 'Upcoming Classes',
    unableToLoadClasses: 'Unable to load classes',
    noUpcomingClasses: 'No upcoming classes scheduled',
    childClasses: "{{name}}'s Classes",
    childrenClasses: "Children's Classes",
  },

  // Settings Screen
  settings: {
    title: 'Settings',
    profile: 'Profile',
    currentPlan: 'Current plan',
    classesThisMonth: 'Classes this month',
    attendance: 'Attendance',
    lastYear: 'Last 12 months',
    tapToSeeDetails: 'Tap a bar to see details',
    day: 'day',
    days: 'days',
    weeksAgo: 'weeks ago',
    now: 'Now',
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
    logoutConfirm: 'Are you sure you want to logout?',
    logoutError: 'Failed to logout. Please try again.',
    version: 'Version',
    appVersion: 'App Version',
    buildNumber: 'Build Number',
    privacy: 'Privacy',
    privacyDescription: 'Control how your information is shared',
    language: 'Language',
    languageDescription: 'Change app language',
  },

  // Privacy Settings
  privacy: {
    title: 'Privacy',
  },

  // Help Screen
  help: {
    contactSupport: 'Contact Support',
    emailSupport: 'Email Support',
    callSupport: 'Call Support',
    clubQuestions: 'Club Questions',
    appQuestions: 'App Questions',
    stillNeedHelp: 'Still need help?',
    stillNeedHelpDescription:
      "Can't find what you're looking for? Our support team is here to help you with any questions or concerns.",
    contactSupportTeam: 'Contact Support Team',
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
    subtitle: 'Sign in to your account',
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

  // Forgot Password Screen
  forgotPassword: {
    title: 'Reset Password',
    subtitle: 'Enter your email address to recover password',
    email: 'Email',
    sendResetLink: 'Send Reset Link',
    successTitle: 'Password Reset Link Sent',
    successMessage:
      "We've sent a password reset link to your email address. Please check your inbox.",
    errorTitle: 'Error',
    errorMessage: 'Failed to send password reset link. Please try again.',
  },

  // Edit Profile Screen
  editProfile: {
    title: 'Edit Profile',
    profilePictureHint: 'Contact your gym to update your profile picture',
    personalInformation: 'Personal Information',
    firstName: 'First Name',
    firstNameRequired: 'First Name *',
    enterFirstName: 'Enter first name',
    lastName: 'Last Name',
    lastNameRequired: 'Last Name *',
    enterLastName: 'Enter last name',
    email: 'Email',
    emailPlaceholder: 'Email address',
    emailCannotChange: 'Email cannot be changed. Contact support if needed.',
    phone: 'Phone',
    enterPhone: 'Enter phone number',
    address: 'Address',
    streetAddress: 'Street Address',
    enterStreetAddress: 'Enter street address',
    city: 'City',
    enterCity: 'Enter city',
    state: 'State',
    statePlaceholder: 'State',
    postalCode: 'Postal Code',
    postalCodePlaceholder: 'Postal code',
    country: 'Country',
    enterCountry: 'Enter country',
    emergencyContact: 'Emergency Contact',
    emergencyContactHint: 'Emergency contacts are managed by your gym administrator.',
    name: 'Name',
    relationship: 'Relationship',
    saving: 'Saving...',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    // Alerts
    errorLoadingProfile: 'Failed to load profile. Please try again.',
    errorLoadingProfileTitle: 'Error',
    validationError: 'Validation Error',
    firstLastNameRequired: 'First name and last name are required',
    profileNotAvailable: 'Profile data not available',
    errorUpdatingProfile: 'Failed to update profile. Please try again.',
    errorUpdatingProfileTitle: 'Error',
    successTitle: 'Success',
    successMessage: 'Profile updated successfully',
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

    // Cancellation
    downloadFailed: 'Download Failed',
    importantInformation: 'Important Information',
    cancellationWarning:
      'Cancelling your membership will end your access to all gym facilities and services.',
    cancellationReversible:
      'You can reverse this decision before the cancellation date takes effect.',
    planName: 'Plan',
    amount: 'Amount',
    cancellationDetails: 'Cancellation Details',
    effectiveCancellationDate: 'Effective Cancellation Date',
    membershipCancelledOn: 'Your membership will be cancelled on: {{date}}',
    earliestCancellationDate: 'Earliest available date: {{date}}',
    noticePeriod: 'Notice Period',
    cancellationReason: 'Reason for Cancellation',
    cancellationReasonPlaceholder: 'Tell us why you are cancelling (optional)...',
    cancellationReasonOptional: 'This helps us improve our services',
    cancelMyMembership: 'Cancel My Membership',
    keepMembership: 'Keep My Membership',
    confirmCancellation: 'Confirm Cancellation',
    confirmCancellationMessage:
      'Are you sure you want to cancel your membership effective {{date}}?',
    yesCancelMembership: 'Yes, Cancel',
    cancellationSuccess: 'Membership Cancelled',
    cancellationError: 'Failed to cancel membership. Please try again.',

    // Revert cancellation
    alreadyCancelled: 'Membership Cancelled',
    membershipEndsOn: 'Your membership will end on {{date}}.',
    changeYourMind: 'Changed Your Mind?',
    revertDescription:
      'If you would like to continue your membership, you can revert the cancellation before it takes effect.',
    revertCancellation: 'Revert Cancellation',
    confirmRevert: 'Revert Cancellation',
    confirmRevertMessage:
      'Would you like to revert your cancellation and keep your membership active?',
    yesRevert: 'Yes, Revert',
    revertSuccess: 'Cancellation Reverted',
    revertSuccessMessage: 'Your membership is active again.',
    revertError: 'Failed to revert cancellation. Please try again.',
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

    // Invoice detail
    invoiceDetails: 'Invoice Details',
    invoiceNumber: 'Invoice Number',
    issueDate: 'Issue Date',
    dueDate: 'Due Date',
    account: 'Account',
    items: 'Items',
    subtotal: 'Subtotal',
    tax: 'Tax',
    taxRate: '({{rate}}%)',
    total: 'Total',
    billingInformation: 'Billing Information',
    addressOnFile: 'Address on file',
    downloadPdf: 'Download PDF',
    invoiceNotFound: 'Invoice not found',
    unableToLoadInvoice: 'Unable to load invoice',
    shareFailed: 'Share Failed',
    shareFailedMessage: 'Failed to share invoice. Please try again.',
    downloadFailed: 'Download Failed',
    downloadFailedMessage: 'Failed to download invoice. Please try again.',
    supportContact: 'For questions about this invoice, please contact {{email}}',
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

  // Class Card
  classCard: {
    today: 'Today',
    tomorrow: 'Tomorrow',
    confirmed: 'Confirmed',
    declined: 'Declined',
    decline: 'Decline',
    confirm: 'Confirm',
    cancelAttendance: 'Cancel Attendance',
    confirmAttendance: 'Confirm Attendance',
    attendanceFailed: 'Failed to update attendance. Please try again.',
    enrolled: '{{count}} enrolled',
    enrolledWithMax: '{{enrolled}}/{{max}} enrolled',
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

  // Graduation / Belt Progress
  graduation: {
    title: 'Belt Progress',
    childTitle: "{{name}}'s Belts",
    currentBelt: 'Current Belt',
    nextBelt: 'Next Belt',
    classesProgress: 'Classes Progress',
    classesRemaining: 'classes remaining',
    stripes: 'stripes',
    nextStripe: 'Next Stripe',
    lastPromotion: 'Last Promotion',
    belts: {
      // Adult belts
      white: 'White Belt',
      blue: 'Blue Belt',
      purple: 'Purple Belt',
      brown: 'Brown Belt',
      black: 'Black Belt',
      // Kids belts - solid
      grey: 'Grey Belt',
      yellow: 'Yellow Belt',
      orange: 'Orange Belt',
      green: 'Green Belt',
      // Kids belts - two-color
      'white-grey': 'White-Grey Belt',
      'grey-white': 'Grey-White Belt',
      'grey-black': 'Grey-Black Belt',
      'yellow-white': 'Yellow-White Belt',
      'yellow-black': 'Yellow-Black Belt',
      'orange-white': 'Orange-White Belt',
      'orange-black': 'Orange-Black Belt',
      'green-white': 'Green-White Belt',
      'green-black': 'Green-Black Belt',
      // Coral & Red belts
      'red-black': 'Coral Belt (Red/Black)',
      'red-white': 'Coral Belt (Red/White)',
      red: 'Red Belt',
    },
  },

  // Leaderboard
  leaderboard: {
    title: 'Leaderboard',
    rankings: 'Rankings',
    you: 'You',
    points: 'points',
    classes: 'classes',
    weeks: 'weeks',
    outOf: 'of {{total}} members',
    topPercentile: "You're in the top {{percent}}% of members!",
    noResults: 'No Results',
    tryDifferentFilters: 'Try adjusting your filters to see more results',
    errorTitle: 'Unable to Load Leaderboard',
    errorMessage: 'Please check your connection and try again',
    anonymous: 'Member',
    filters: {
      title: 'Filters',
      button: 'Filters',
      apply: 'Apply Filters',
      timePeriod: 'Time Period',
      discipline: 'Discipline',
      demographic: 'Age Group',
    },
    timePeriods: {
      week: 'Week',
      month: 'Month',
      year: 'Year',
    },
  },

  // Notifications
  notifications: {
    title: 'Notifications',
    all: 'All',
    classes: 'Classes',
    achievements: 'Achievements',
    reminders: 'Reminders',
    billing: 'Billing',
    noNotifications: 'No notifications',
    noNotificationsMessage: "You're all caught up! Check back later for updates.",
    unreadCount: '{{count}} unread',
    markAllRead: 'Mark all read',
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

  // Language Selection
  language: {
    title: 'Select Language',
    current: 'Current language',
    changeLanguage: 'Change Language',
    languages: {
      en: 'English',
      de: 'Deutsch',
      'pt-BR': 'Português (Brasil)',
      tr: 'Türkçe',
    },
  },

  // About Section
  about: {
    title: 'About',
    aboutDescription: 'App info, privacy policy, and more',
    privacyPolicy: 'Privacy Policy',
    privacyPolicyDescription: 'Read our privacy policy',
    versionHistory: 'Version History',
    versionHistoryDescription: "See what's new",
    poweredBy: '{{appName}} is powered by Omoplata',
  },
};
