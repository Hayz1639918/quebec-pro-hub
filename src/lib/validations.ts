import { z } from 'zod';

export const newProjectSchema = z.object({
  title: z.string().min(5, 'Le titre doit contenir au moins 5 caractères').max(200),
  description: z.string().min(20, 'La description doit contenir au moins 20 caractères').max(5000),
  category: z.string().min(1, 'Veuillez sélectionner une catégorie'),
  project_type: z.string().optional(),
  budget_min: z.number().min(0, 'Le budget minimum doit être positif').optional(),
  budget_max: z.number().min(0, 'Le budget maximum doit être positif').optional(),
  city: z.string().min(1, 'Veuillez indiquer la ville').optional(),
  region: z.string().optional(),
  postal_code: z.string().regex(/^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/, 'Code postal invalide (ex: H2X 1Y4)').optional().or(z.literal('')),
  deadline: z.string().optional(),
  urgency: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  payment_terms: z.string().optional(),
}).refine(
  (data) => !data.budget_min || !data.budget_max || data.budget_max >= data.budget_min,
  { message: 'Le budget maximum doit être supérieur au minimum', path: ['budget_max'] }
);

export const contractBuilderSchema = z.object({
  title: z.string().min(3, 'Le titre du contrat est requis').max(255),
  description: z.string().max(5000).optional(),
  client_id: z.string().uuid('Client invalide'),
  project_id: z.string().uuid('Projet invalide'),
  total_amount: z.number().positive('Le montant doit être positif'),
  currency: z.string().default('CAD'),
  deposit_percentage: z.number().min(0).max(100).default(0),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  estimated_duration_days: z.number().positive().optional(),
  warranty_period_months: z.number().min(0).max(120).default(12),
  terms_and_conditions: z.string().optional(),
  special_conditions: z.string().optional(),
});

export const milestoneSchema = z.object({
  title: z.string().min(2, 'Le titre du jalon est requis').max(255),
  amount: z.number().positive('Le montant doit être positif'),
  due_date: z.string().optional(),
});

export const milestonesArraySchema = z.array(milestoneSchema).min(1, 'Au moins un jalon est requis');

export const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Veuillez donner une note').max(5),
  comment: z.string().min(10, 'Le commentaire doit contenir au moins 10 caractères').max(2000),
});

export const disputeSchema = z.object({
  category: z.enum(['quality', 'delay', 'payment', 'communication', 'other'], {
    required_error: 'Veuillez sélectionner une catégorie',
  }),
  description: z.string().min(50, 'La description doit contenir au moins 50 caractères').max(5000),
});

export const proposeContractSchema = z.object({
  project_id: z.string().uuid(),
  client_id: z.string().uuid(),
  title: z.string().min(3).max(255),
  total_amount: z.number().positive(),
  deposit_percentage: z.number().min(0).max(100),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  estimated_duration_days: z.number().positive().optional(),
  special_conditions: z.string().max(5000).optional(),
});

export type NewProjectInput = z.infer<typeof newProjectSchema>;
export type ContractBuilderInput = z.infer<typeof contractBuilderSchema>;
export type MilestoneInput = z.infer<typeof milestoneSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type DisputeInput = z.infer<typeof disputeSchema>;
export type ProposeContractInput = z.infer<typeof proposeContractSchema>;
