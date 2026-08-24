-- KitchenOps
-- Operations user invitations
--
-- Pending invitations are deliberately stored separately from
-- business_memberships.
--
-- A pending invitation must never count as an active Operations user.

create table if not exists public.operations_invitations (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete cascade,

  email text not null,
  display_name text not null,

  token_hash text not null,

  status text not null default 'pending',

  invited_by uuid not null
    references auth.users(id)
    on delete set null,

  expires_at timestamptz not null,

  accepted_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint operations_invitations_email_required
    check (length(trim(email)) > 3),

  constraint operations_invitations_name_required
    check (length(trim(display_name)) > 1),

  constraint operations_invitations_token_required
    check (length(trim(token_hash)) > 20),

  constraint operations_invitations_status_valid
    check (
      status in (
        'pending',
        'accepted',
        'revoked',
        'expired'
      )
    )
);

create unique index if not exists operations_invitations_pending_email_unique
  on public.operations_invitations (
    business_id,
    lower(email)
  )
  where status = 'pending';

create index if not exists operations_invitations_business_idx
  on public.operations_invitations (
    business_id,
    created_at desc
  );

create unique index if not exists operations_invitations_token_idx
  on public.operations_invitations (
    token_hash
  );

create or replace function public.touch_operations_invitation_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists operations_invitations_touch_updated_at
  on public.operations_invitations;

create trigger operations_invitations_touch_updated_at
before update on public.operations_invitations
for each row
execute function public.touch_operations_invitation_updated_at();

alter table public.operations_invitations
enable row level security;

revoke all
on table public.operations_invitations
from anon, authenticated;

grant select, insert, update, delete
on table public.operations_invitations
to service_role;