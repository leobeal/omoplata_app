export default {
  // Navegação
  nav: {
    dashboard: 'Painel',
    checkin: 'Check-in',
    classes: 'Aulas',
    membership: 'Assinatura',
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
    requestingPermission: 'Solicitando permissão da câmera...',
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

  // Tela de Assinatura
  membership: {
    title: 'Minha Assinatura',
    currentPlan: 'Plano Atual',
    memberId: 'ID do Membro',
    membershipId: 'ID da Assinatura',
    members: 'Membros',
    contractId: 'ID do Contrato',
    contractDetails: 'Detalhes do Contrato',
    startDate: 'Data de Início',
    endDate: 'Data de Término',
    renewalDate: 'Data de Renovação',
    nextCancellationDate: 'Próxima Data de Cancelamento',
    autoRenewal: 'Renovação Automática',
    enabled: 'Ativado',
    disabled: 'Desativado',
    pricing: 'Preços',
    annualFee: 'Taxa Anual',
    monthlyFee: 'Taxa Mensal',
    monthlyEquivalent: 'Equivalente Mensal',
    billedAnnually: 'Faturado anualmente',
    billedMonthly: 'Faturado mensalmente',
    billedWeekly: 'Faturado semanalmente',
    contractDuration: 'Duração do Contrato',
    perMonth: '/mês',
    planFeatures: 'Recursos do Plano',
    limit: 'Limite',
    paymentMethod: 'Forma de Pagamento',
    accountHolder: 'Titular da Conta',
    policies: 'Políticas de Assinatura',
    cancellationPolicy: 'Política de Cancelamento',
    freezePolicy: 'Política de Congelamento',
    transferPolicy: 'Política de Transferência',
    downloadContract: 'Baixar Contrato PDF',
    cancelMembership: 'Cancelar Assinatura',
    noMembership: 'Nenhuma assinatura encontrada',
    supportMessage: 'Para dúvidas sobre sua assinatura, entre em contato com support@omoplata.com',

    // Download messages
    contractPdfTitle: 'Contrato PDF',
    contractDownloadMessage: 'O contrato seria baixado de: {{url}}',
    downloadError: 'Falha ao baixar o contrato PDF',

    // Policy details
    daysNoticeRequired: '{{count}} dias de aviso necessários',
    upTo: 'Até',
    daysPerYear: '{{count}} dias por ano',
    defaultCancellationPolicy: 'Entre em contato com o suporte para detalhes de cancelamento',
    defaultFreezePolicy: 'Congelamento disponível mediante solicitação',
    defaultTransferPolicy: 'Assinaturas não são transferíveis',

    // Status
    new: 'Novo',
    onboardingStarted: 'Onboarding Iniciado',
    active: 'Ativo',
    paused: 'Pausado',
    cancelled: 'Cancelado',
    defaulted: 'Inadimplente',

    // Status descriptions
    newDescription: 'Assinatura criada, aguardando onboarding',
    onboardingStartedDescription: 'Onboarding em andamento',
    activeDescription: 'Assinatura ativa',
    pausedDescription: 'Assinatura temporariamente pausada',
    cancelledDescription: 'Assinatura cancelada',
    defaultedDescription: 'Inadimplência - entre em contato com o suporte',

    // Document requests
    documentRequests: 'Solicitações de Documentos',
    pendingDocuments: 'Documentos Pendentes',
    documentRequired: 'Documento Necessário',
    uploadDocument: 'Enviar Documento',
    uploading: 'Enviando...',
    uploadSuccess: 'Documento enviado com sucesso',
    uploadError: 'Falha ao enviar documento',
    selectFile: 'Selecionar Arquivo',
    takePhoto: 'Tirar Foto',
    chooseFromLibrary: 'Escolher da Galeria',

    // Document types
    documentTypes: {
      studentProof: 'Carteira de Estudante',
      idCard: 'Carteira de Identidade',
      passport: 'Passaporte',
      proofOfAddress: 'Comprovante de Endereço',
      medicalCertificate: 'Atestado Médico',
      other: 'Outro Documento',
    },
  },

  // Tela de Faturamento
  billing: {
    title: 'Faturamento',
    nextInvoice: 'Próxima Fatura',
    due: 'Vencimento',
    viewDetails: 'Ver Detalhes',
    recentInvoices: 'Faturas Recentes',
    paymentMethod: 'Forma de Pagamento',
    sepaDirectDebit: 'Débito Direto SEPA',
    edit: 'Editar',
    loadMore: 'Carregar Mais',

    // Status da fatura
    paid: 'Pago',
    pending: 'Pendente',
    overdue: 'Vencido',
  },

  // Formulário SEPA
  sepaForm: {
    title: 'Configurar Débito Direto',
    subtitle: 'Adicione seus dados bancários para ativar pagamentos automáticos',
    accountHolder: 'Titular da Conta',
    accountHolderPlaceholder: 'Nome completo como aparece na conta',
    iban: 'IBAN',
    ibanPlaceholder: 'DE89 3704 0044 0532 0130 00',
    bic: 'BIC/SWIFT (opcional)',
    bicPlaceholder: 'COBADEFFXXX',
    mandateText:
      'Ao fornecer seu IBAN, você autoriza o envio de instruções ao seu banco para debitar sua conta de acordo com essas instruções.',
    submitButton: 'Configurar Débito Direto',
    submitting: 'Configurando...',
    successMessage: 'Débito direto configurado com sucesso',
    errorMessage: 'Falha ao configurar débito direto. Por favor, tente novamente.',
    invalidIban: 'Por favor, insira um IBAN válido',
    invalidAccountHolder: 'Por favor, insira o nome do titular da conta',
  },

  // Tela de Aulas
  classes: {
    title: 'Todas as Aulas',
    filters: 'Filtros',
    clearFilters: 'Limpar Tudo',
    category: 'Categoria',
    level: 'Nível',
    instructor: 'Instrutor',
    location: 'Localização',
    showingResults: 'Mostrando {{count}} de {{total}} aulas',
    loadMore: 'Carregar Mais Aulas',
    noClassesFound: 'Nenhuma Aula Encontrada',
    tryDifferentFilters: 'Tente ajustar seus filtros',
  },

  // Calendário
  calendar: {
    title: 'Calendário de Aulas',
    legend: 'Categorias de Aulas',
    noClasses: 'Nenhuma aula agendada para este dia',
    errorTitle: 'Não foi possível carregar as aulas',
    today: 'Hoje',
    scheduled: 'agendadas',
    classCount: {
      one: 'aula',
      other: 'aulas',
    },
  },

  // Club não encontrado
  clubNotFound: {
    title: 'Academia não encontrada',
    message:
      'Não conseguimos encontrar esta academia. A academia pode ter sido removida ou o link utilizado pode estar incorreto.',
    suggestions: 'O que você pode tentar:',
    checkUrl: 'Verifique se a URL ou código da academia está correto',
    contactClub: 'Entre em contato com sua academia diretamente para verificar os dados',
    tryLater: 'Tente novamente mais tarde, caso seja um problema temporário',
    selectDifferentClub: 'Selecionar outra academia',
  },

  // Frequências / Durações (ISO 8601)
  frequency: {
    // Intervalos recorrentes (para charge_interval)
    recurring: {
      P1D: 'diário',
      P1W: 'semanal',
      P2W: 'a cada 2 semanas',
      P1M: 'mensal',
      P3M: 'a cada 3 meses',
      P6M: 'a cada 6 meses',
      P12M: 'a cada 12 meses',
      P18M: 'a cada 18 meses',
      P24M: 'a cada 24 meses',
      P1Y: 'anual',
    },
    // Durações únicas (para contract_duration)
    once: {
      P1W: '1 semana',
      P1M: '1 mês',
      P2M: '2 meses',
      P3M: '3 meses',
      P6M: '6 meses',
      P12M: '12 meses',
      P18M: '18 meses',
      P24M: '24 meses',
      P1Y: '1 ano',
      P2Y: '2 anos',
    },
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
