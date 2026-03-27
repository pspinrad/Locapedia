// ============================================================
// config.js — Locapedia site configuration
// Copy this file, fill in your Supabase credentials,
// and DO NOT commit the filled-in version to GitHub.
// Add config.js to your .gitignore.
// ============================================================

const CONFIG = {

  // -- Site identity ----------------------------------------
  site_name:    "Locapedia",
  site_tagline: "A shared reference for small-business business models",
  site_about:   `Locapedia is a community-maintained database of business models
                 for small, local businesses. Anyone can browse or submit a model;
                 submissions are reviewed before publication.`,

  // -- Supabase connection ----------------------------------
  // Find these in your Supabase project: Settings → API
  supabase_url: "https://biwlqqzfgeskfjnfxjmi.supabase.co",
  supabase_key: "sb_publishable_Is6AQXTgsxQCoTnUlj7WQw_mHBk5LCY",   // anon/public key (safe for browser)

  // -- Admin authentication ---------------------------------
  // A simple shared password. Keep this file out of version control.
  admin_password: "M0053-4-3V3R!",

  // -- Database table names ---------------------------------
  table_approved:  "business_models",     // approved, public objects
  table_pending:   "submissions",         // awaiting admin review

};


// ============================================================
// Field definitions for business model objects.
// Each field has:
//   key         — matches the database column name
//   label       — human-readable field label
//   type        — "single_line" or "multiline"
//   mandatory   — true = required on submission form
//   simple_search — true = searched and shown in simple search results
//   helper_text — placeholder shown in empty form inputs
//   section     — "core" or "canvas" (controls UI grouping)
// ============================================================

const FIELDS = [

  // -- Core fields ------------------------------------------
  {
    key:           "name",
    label:         "Business Model Name",
    type:          "single_line",
    mandatory:     true,
    simple_search: true,
    section:       "core",
    helper_text:   "e.g. Coworking Space with Childcare, Tortilleria, Solar Installer Co-op, In-Home Physical Therapy, Plastics Recycler",
  },
  {
    key:           "description",
    label:         "Description",
    type:          "multiline",
    mandatory:     true,
    simple_search: true,
    section:       "core",
    helper_text:   "Describe the business model in plain terms. Markdown supported.",
  },
  {
    key:           "sector",
    label:         "Sector / Industry",
    type:          "single_line",
    mandatory:     true,
    simple_search: true,
    section:       "core",
    helper_text:   "e.g. Food & Beverage, Retail, Services...",
  },
  {
    key:           "naics",
    label:         "NAICS Code",
    type:          "single_line",
    mandatory:     false,
    simple_search: false,
    section:       "core",
    helper_text:   "Industry classification code; see https://www.census.gov/naics/",
  },
  {
    key:           "structure",
    label:         "Legal Structure",
    type:          "single_line",
    mandatory:     false,
    simple_search: false,
    section:       "core",
    helper_text:   "What legal entity types are best suited for the business? Examples: partnership, LLC, nonprofit, sole proprietorship, B-Corp",
  },
  {
    key:           "ownership",
    label:         "Ownership",
    type:          "single_line",
    mandatory:     false,
    simple_search: false,
    section:       "core",
    helper_text:   "What ownership structures are best suited to this business? Examples: employee co-op, owner-operator, equity shareholders",
  },

  // -- Business Model Canvas fields -------------------------
  {
    key:           "value_prop",
    label:         "Value",
    type:          "multiline",
    mandatory:     false,
    simple_search: false,
    section:       "canvas",
    helper_text:   "What do your customers need, want, or like that you provide? Why do they choose this business?",
  },
  {
    key:           "customers",
    label:         "Customers",
    type:          "multiline",
    mandatory:     false,
    simple_search: false,
    section:       "canvas",
    helper_text:   "Who are your customers? What characterizes or categorizes them?",
  },
  {
    key:           "channels",
    label:         "Channels",
    type:          "multiline",
    mandatory:     false,
    simple_search: false,
    section:       "canvas",
    helper_text:   "Through what physical or virtual presences do your customers learn about, buy, receive, or use your products or services? Examples: storefront, social media, truck.",
  },
  {
    key:           "customer_relations",
    label:         "Customer Relationships",
    type:          "multiline",
    mandatory:     false,
    simple_search: false,
    section:       "canvas",
    helper_text:   "What are the relationships or dynamics between this business and its customers? Examples: personal attention, self-service, community events, loyalty programs.",
  },
  {
    key:           "revenue_streams",
    label:         "Revenue Streams",
    type:          "multiline",
    mandatory:     false,
    simple_search: false,
    section:       "canvas",
    helper_text:   "How does this business generate revenue? Examples: direct payment, subscription, commission, fee-for-service, voucher.",
  },
  {
    key:           "activities",
    label:         "Activities",
    type:          "multiline",
    mandatory:     false,
    simple_search: false,
    section:       "canvas",
    helper_text:   "What are the human and machine processes that this business runs to generate value for its customers?",
  },
  {
    key:           "resources",
    label:         "Resources",
    type:          "multiline",
    mandatory:     false,
    simple_search: false,
    section:       "canvas",
    helper_text:   "What people, experience, degrees or certifications, tools, materials, spaces, funds, or other resources does this business need to operate?",
  },
  {
    key:           "partnerships",
    label:         "Partners",
    type:          "multiline",
    mandatory:     false,
    simple_search: false,
    section:       "canvas",
    helper_text:   "What partners does this business need to serve its customers? Examples: suppliers, service providers, unions, regulators, community organizations.",
  },
  {
    key:           "costs",
    label:         "Costs",
    type:          "multiline",
    mandatory:     false,
    simple_search: false,
    section:       "canvas",
    helper_text:   "What does this business need to pay for to serve its customers? Examples: payroll, rent, supplies, services, insurance.",
  },

];


// Derived convenience sets (used throughout app.js)
const SIMPLE_SEARCH_FIELDS = FIELDS.filter(f => f.simple_search);
const MANDATORY_FIELDS      = FIELDS.filter(f => f.mandatory);
