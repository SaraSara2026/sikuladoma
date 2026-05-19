export const INVOICE_STATUS_MAP = {
  draft: { label: 'Koncept',        color: 'badge-gray'  },
  sent:  { label: 'Odesláno',       color: 'badge-blue'  },
  paid:  { label: 'Zaplaceno',      color: 'badge-green' },
  late:  { label: 'Po splatnosti',  color: 'badge-red'   },
};

export const DEMO_INVOICES = [
  { id: 'FAK-2025-001', title: 'Montáž nábytku',  amount: 2500, customer: 'Jana Nováková',  created: '1. 5. 2025', due: '15. 5. 2025', status: 'paid'  },
  { id: 'FAK-2025-002', title: 'Malování pokoje',  amount: 4800, customer: 'Petr Svoboda',   created: '5. 5. 2025', due: '19. 5. 2025', status: 'sent'  },
  { id: 'FAK-2025-003', title: 'Oprava kohoutu',   amount: 900,  customer: 'Marie Horáková', created: '8. 5. 2025', due: '22. 5. 2025', status: 'draft' },
];
