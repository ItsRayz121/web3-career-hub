-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade unique not null,
  full_name text default '',
  professional_title text default '',
  email text default '',
  phone text default '',
  country text default '',
  city text default '',
  nationality text,
  linkedin_url text,
  portfolio_url text,
  github_url text,
  twitter_url text,
  telegram_url text,
  wallet_address text,
  professional_summary text default '',
  target_role text default '',
  years_experience integer default 0,
  work_type text default 'remote',
  profile_image_url text,
  desired_industries text[] default '{}',
  preferred_countries text[] default '{}',
  salary_expectation text,
  relocation_willing boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Experience table
create table experiences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  company_name text not null,
  role_title text not null,
  employment_type text default 'full-time',
  location text default '',
  start_date date not null,
  end_date date,
  is_current boolean default false,
  responsibilities text default '',
  achievements text default '',
  tools_used text[] default '{}',
  industry_tags text[] default '{}',
  created_at timestamp with time zone default now()
);

-- Education table
create table education (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  degree text not null,
  institution text not null,
  location text default '',
  start_date date not null,
  end_date date,
  grade text,
  achievements text,
  thesis text,
  created_at timestamp with time zone default now()
);

-- Skills table
create table skills (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category text default 'technical',
  level text default 'intermediate',
  created_at timestamp with time zone default now()
);

-- Certifications table
create table certifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  issuer text not null,
  issue_date date not null,
  expiry_date date,
  credential_id text,
  credential_url text,
  file_url text,
  created_at timestamp with time zone default now()
);

-- Projects table
create table projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  role text not null,
  description text default '',
  technologies text[] default '{}',
  impact text default '',
  project_url text,
  created_at timestamp with time zone default now()
);

-- Generated documents table
create table generated_documents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('cv', 'resume', 'cover_letter')),
  title text not null,
  content text not null,
  job_title text,
  company_name text,
  tone text default 'professional',
  ai_score integer,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Saved opportunities table
create table saved_opportunities (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  opportunity_id text not null,
  opportunity_type text not null check (opportunity_type in ('job', 'collaboration', 'scholarship', 'promotion')),
  title text not null,
  company text default '',
  url text not null,
  status text default 'saved' check (status in ('saved', 'applied', 'interview', 'offer', 'rejected')),
  deadline date,
  notes text,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Prompt templates table
create table prompt_templates (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text not null,
  sector text not null,
  description text not null,
  prompt text not null,
  tone text default 'professional',
  is_system boolean default true,
  created_at timestamp with time zone default now()
);

-- Row Level Security
alter table profiles enable row level security;
alter table experiences enable row level security;
alter table education enable row level security;
alter table skills enable row level security;
alter table certifications enable row level security;
alter table projects enable row level security;
alter table generated_documents enable row level security;
alter table saved_opportunities enable row level security;

create policy "Users can manage own profile" on profiles for all using (auth.uid() = user_id);
create policy "Users can manage own experiences" on experiences for all using (auth.uid() = user_id);
create policy "Users can manage own education" on education for all using (auth.uid() = user_id);
create policy "Users can manage own skills" on skills for all using (auth.uid() = user_id);
create policy "Users can manage own certifications" on certifications for all using (auth.uid() = user_id);
create policy "Users can manage own projects" on projects for all using (auth.uid() = user_id);
create policy "Users can manage own documents" on generated_documents for all using (auth.uid() = user_id);
create policy "Users can manage own saved opportunities" on saved_opportunities for all using (auth.uid() = user_id);
create policy "Anyone can read prompt templates" on prompt_templates for select using (true);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Insert default prompt templates
insert into prompt_templates (name, category, sector, description, prompt, tone) values
('Web3 Resume', 'resume', 'blockchain', 'Optimized for blockchain and Web3 roles', 'Generate a powerful, ATS-friendly resume for a Web3/blockchain professional. Focus on on-chain achievements, DeFi/NFT/DAO experience, and technical blockchain skills. Write in active voice, use strong action verbs, quantify impact wherever possible. Sound like a senior Web3 professional wrote this, not an AI.', 'confident'),
('Blockchain BD Resume', 'resume', 'blockchain', 'Business development in crypto/Web3 space', 'Create a business development resume for the blockchain/crypto industry. Emphasize partnership deals closed, ecosystem growth, community building, and revenue generated. Highlight Web3 network and protocol relationships. Write naturally with a growth-focused tone.', 'professional'),
('Content Creator Resume', 'resume', 'content', 'For content creators and social media professionals', 'Build a resume for a content creator/social media professional. Focus on audience growth metrics, engagement rates, platform expertise, brand collaborations, and content performance. Include measurable results. Write in a creative but professional tone.', 'creative'),
('Human Cover Letter', 'cover_letter', 'general', 'Sounds genuinely human, warm and personalized', 'Write a cover letter that sounds like a real, thoughtful human wrote it — not AI. Be specific about why this company and role matter. Show genuine enthusiasm without being generic. Use natural sentence variation. Avoid cliches like passionate about, fast-paced, team player. Make it memorable and authentic.', 'conversational'),
('Web3 Cover Letter', 'cover_letter', 'blockchain', 'Tailored for Web3 companies and DAOs', 'Write a cover letter for a Web3/crypto/blockchain company. Show deep understanding of the space — mention relevant protocols, trends, or the company mission specifically. Sound like someone who lives and breathes Web3, not someone who just learned what a blockchain is. Be direct, confident, and value-focused.', 'confident'),
('ATS Optimizer', 'resume', 'general', 'Maximize ATS keyword matching', 'Rewrite this resume to maximize ATS (Applicant Tracking System) compatibility. Extract all keywords from the job description and naturally incorporate them. Maintain readability while ensuring critical keywords appear. Do not stuff keywords unnaturally — integrate them into real achievement statements.', 'professional'),
('Scholarship SOP', 'cv', 'academic', 'Statement of purpose for scholarships', 'Write a compelling statement of purpose / personal statement for a scholarship application. Be authentic, specific about academic goals, research interests, and how this scholarship advances those goals. Show intellectual curiosity and concrete plans. Sound like a passionate, focused graduate student.', 'academic'),
('LinkedIn Summary', 'linkedin', 'general', 'Compelling LinkedIn About section', 'Write a LinkedIn About section that grabs attention in the first line, tells a compelling professional story, and ends with a clear call to action. Write in first person, sound human and approachable, avoid corporate buzzwords. Make it memorable within 200 words.', 'conversational'),
('Veterinary Resume', 'resume', 'veterinary', 'For veterinary professionals', 'Create a professional resume for a veterinary professional. Highlight clinical skills, species experience, surgical procedures, diagnostic abilities, and client communication. Include any research, publications, or specialized training. Professional and clinical in tone.', 'professional'),
('Marketing & Growth Resume', 'resume', 'marketing', 'For marketing and growth roles', 'Build a resume for a marketing/growth professional. Lead with the most impactful metrics — traffic grown, conversions improved, campaigns managed, budgets handled. Show both strategy and execution skills. Write in a results-driven, direct style.', 'confident');
