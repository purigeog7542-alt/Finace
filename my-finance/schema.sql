-- ตั้งค่า Timezone
alter database postgres set timezone to 'Asia/Bangkok';

-- 1. ตารางข้อมูลผู้ใช้งาน (Profiles)
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    currency text default 'THB',
    created_at timestamptz default now()
);

-- 2. ตารางหมวดหมู่ (Categories)
create table if not exists public.categories (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    type text not null check (type in ('income', 'expense')),
    icon text default 'wallet',
    color text default '#10B981',
    is_active boolean default true,
    created_at timestamptz default now()
);

-- 3. ตารางบัญชี (Accounts)
create table if not exists public.accounts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    opening_balance numeric(14,2) default 0,
    created_at timestamptz default now()
);

-- 4. ตารางบันทึกธุรกรรม (Transactions)
create table if not exists public.transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    account_id uuid not null references public.accounts(id) on delete cascade,
    category_id uuid references public.categories(id) on delete set null,
    type text not null check (type in ('income', 'expense', 'transfer')),
    amount numeric(14,2) not null check (amount > 0),
    description text,
    transaction_date date not null default current_date,
    created_at timestamptz default now()
);

-- 5. ตารางงบประมาณรายเดือน (Budgets)
create table if not exists public.budgets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    category_id uuid references public.categories(id) on delete cascade,
    budget_month int not null check (budget_month between 1 and 12),
    budget_year int not null,
    amount_limit numeric(14,2) not null check (amount_limit > 0)
);

-- 6. ตารางเป้าหมายการออม (Savings Goals)
create table if not exists public.savings_goals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    goal_name text not null,
    target_amount numeric(14,2) not null,
    current_amount numeric(14,2) default 0,
    target_date date,
    status text default 'active',
    created_at timestamptz default now()
);

-- 7. ตารางรายการรับจ่ายประจำ (Recurring Transactions)
create table if not exists public.recurring_transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    category_id uuid references public.categories(id) on delete set null,
    type text not null check (type in ('income', 'expense')),
    amount numeric(14,2) not null,
    description text,
    frequency text not null,
    next_due_date date not null,
    is_active boolean default true
);

-- Indexes
create index if not exists transactions_date_idx on public.transactions (user_id, transaction_date);
create index if not exists transactions_category_idx on public.transactions (category_id);

-- เปิดใช้งาน Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.savings_goals enable row level security;
alter table public.recurring_transactions enable row level security;

-- สร้าง Policies สำหรับจัดการข้อมูลเฉพาะเจ้าของบัญชี
create policy "Users can manage own profiles" on public.profiles for all using (auth.uid() = id);
create policy "Users can manage own categories" on public.categories for all using (auth.uid() = user_id);
create policy "Users can manage own accounts" on public.accounts for all using (auth.uid() = user_id);
create policy "Users can manage own transactions" on public.transactions for all using (auth.uid() = user_id);
create policy "Users can manage own budgets" on public.budgets for all using (auth.uid() = user_id);
create policy "Users can manage own savings_goals" on public.savings_goals for all using (auth.uid() = user_id);
create policy "Users can manage own recurring_transactions" on public.recurring_transactions for all using (auth.uid() = user_id);
