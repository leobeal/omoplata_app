export default {
  // Navegação
  nav: {
    dashboard: 'Painel',
    checkin: 'Check-in',
    billing: 'Faturamento',
    settings: 'Configurações',
  },

  // Comum
  common: {
    close: 'Fechar',
    back: 'Voltar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Salvar',
    delete: 'Excluir',
    edit: 'Editar',
    loading: 'Carregando...',
    error: 'Erro',
    success: 'Sucesso',
    retry: 'Tentar novamente',
    viewPlans: 'Ver Planos',
    logout: 'Sair',
  },

  // Tela Inicial/Painel
  home: {
    welcomeBack: 'Bem-vindo de volta!',
    goodMorning: 'Bom dia!',
    goodAfternoon: 'Boa tarde!',
    goodEvening: 'Boa noite!',
    membershipStatus: 'Status da Assinatura',
    activeMember: 'Membro Ativo',
    classesLeft: 'Aulas Restantes',
    unlimited: 'Ilimitado',
    nextBilling: 'Próximo Pagamento',
    memberSince: 'Membro Desde',
    classes: 'Aulas',
    checkins: 'Check-ins',
    thisMonth: 'este mês',
    thisWeek: 'esta semana',
    lastSevenDays: 'Últimos 7 dias',
    goalProgress: 'Progresso da Meta',
    monthly: 'Mensal',
    weeklyActivity: 'Atividade Semanal',
    pastThreeWeeks: 'Últimas 3 semanas',
    onTrack: 'no caminho certo',
  },

  // Tela de Configurações
  settings: {
    title: 'Configurações',
    profile: 'Perfil',
    currentPlan: 'Plano atual',
    classesThisMonth: 'Aulas este mês',
    upgradeMembership: 'Atualizar Assinatura',
    unlockUnlimitedClasses: 'Desbloqueie aulas ilimitadas',
    editProfile: 'Editar Perfil',
    updatePersonalInfo: 'Atualize suas informações pessoais',
    membership: 'Assinatura',
    manageSubscription: 'Gerencie sua assinatura',
    notifications: 'Notificações',
    classRemindersAndUpdates: 'Lembretes de aulas e atualizações',
    helpAndSupport: 'Ajuda e Suporte',
    getHelp: 'Obtenha ajuda com sua conta',
    logout: 'Sair',
    signOut: 'Sair da sua conta',
  },

  // Tela de Assinaturas
  memberships: {
    title: 'Planos de Assinatura',
    chooseYourPlan: 'Escolha seu plano',
    flexibleOptions: 'Opções flexíveis de assinatura para sua jornada fitness',
    allPlansInclude: 'Todos os planos incluem acesso às nossas instalações de última geração',
    selectPlan: 'Selecionar Plano {{plan}}',
    whatsIncluded: 'O QUE ESTÁ INCLUÍDO',
    perMonth: '/mês',
    off: 'desconto',

    // Nomes dos planos
    basic: 'Básico',
    monthlyPremium: 'Premium Mensal',
    annualPremium: 'Premium Anual',

    // Descrições dos planos
    basicDescription: 'Perfeito para começar',
    monthlyDescription: 'Mais popular para membros dedicados',
    annualDescription: 'Melhor valor para atletas comprometidos',

    // Recursos
    gymFloorAccess: 'Acesso à área de musculação',
    groupClasses: '{{count}} aulas em grupo por mês',
    unlimitedGymAccess: 'Acesso ilimitado à academia',
    unlimitedGroupClasses: 'Aulas em grupo ilimitadas',
    basicEquipment: 'Equipamento básico',
    lockerAccess: 'Acesso ao vestiário',
    premiumLocker: 'Armário premium',
    personalTrainingSession: 'Sessão de treinamento personalizado',
    personalTrainingSessions: '{{count}} sessões de treinamento personalizado',
    guestPasses: 'Passes de convidado ({{count}}/mês)',
    allPremiumFeatures: 'Todos os recursos Premium',
    nutritionConsultation: 'Consulta nutricional',
    freeMerchandise: 'Mercadoria grátis',
    priorityClassBooking: 'Reserva prioritária de aulas',
  },

  // Tela de Check-in
  checkin: {
    title: 'Escanear Código QR',
    permissionRequired: 'Permissão da Câmera Necessária',
    grantPermission: 'Conceder Permissão',
    permissionMessage: 'Por favor, conceda acesso à câmera para escanear códigos QR no check-in',
    goBack: 'Voltar',
    pointCameraAtQR: 'Aponte a câmera para o código QR',
    alignQRCode: 'Alinhe o código QR dentro do quadro',
    checkingIn: 'Fazendo check-in...',
    checkInSuccess: 'Check-in Realizado!',
    welcomeBack: 'Bem-vindo de volta, {{name}}!',
    checkInNumber: 'Check-in #{{count}} este mês',
    keepUpStreak: 'Continue assim!',

    // Erros
    invalidQRCode: 'Código QR inválido',
    alreadyCheckedIn: 'Você já fez check-in',
    membershipInactive: 'Sua assinatura está inativa.\nPor favor, entre em contato com a recepção.',
    checkInFailed: 'Falha no check-in',
    networkError: 'Erro de rede. Por favor, tente novamente.',
  },

  // Tela de Login
  login: {
    title: 'Entrar',
    email: 'E-mail',
    password: 'Senha',
    forgotPassword: 'Esqueceu a senha?',
    login: 'Entrar',
    noAccount: 'Não tem uma conta?',
    signUp: 'Cadastre-se',

    // Validação
    emailRequired: 'E-mail é obrigatório',
    invalidEmail: 'Por favor, insira um e-mail válido',
    passwordRequired: 'Senha é obrigatória',
    passwordTooShort: 'A senha deve ter pelo menos 6 caracteres',
    loginFailed: 'Falha no login. Por favor, verifique suas credenciais.',
  },

  // Data/Hora
  date: {
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    sunday: 'Domingo',

    january: 'Janeiro',
    february: 'Fevereiro',
    march: 'Março',
    april: 'Abril',
    may: 'Maio',
    june: 'Junho',
    july: 'Julho',
    august: 'Agosto',
    september: 'Setembro',
    october: 'Outubro',
    november: 'Novembro',
    december: 'Dezembro',
  },
};
