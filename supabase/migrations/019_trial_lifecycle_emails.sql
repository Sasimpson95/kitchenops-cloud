create table if not exists public.trial_lifecycle_emails (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete cascade,

  recipient_email text not null,

  email_type text not null,

  sent_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);

create unique index if not exists trial_lifecycle_emails_business_type_unique
  on public.trial_lifecycle_emails (business_id, email_type);

create index if not exists trial_lifecycle_emails_business_id_idx
  on public.trial_lifecycle_emails (business_id);

create index if not exists trial_lifecycle_emails_sent_at_idx
  on public.trial_lifecycle_emails (sent_at);