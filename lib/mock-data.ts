export type NavItem = {
  href: string;
  labelKey:
    | "overview"
    | "discover"
    | "bookings"
    | "receipts"
    | "inbox"
    | "request"
    | "support"
    | "worker"
    | "admin";
};

export type WorkerProfile = {
  name: string;
  role: string;
  rate: string;
  eta: string;
  area: string;
  rating: string;
  completedJobs: number;
  availability: string;
  tags: string[];
  blurb: string;
};

export type BookingItem = {
  service: string;
  worker: string;
  when: string;
  status: string;
  address: string;
  price: string;
};

export const publicNav: NavItem[] = [
  { href: "/", labelKey: "overview" },
];

export const hirerNav: NavItem[] = [
  { href: "/discover", labelKey: "discover" },
  { href: "/bookings", labelKey: "bookings" },
  { href: "/receipts", labelKey: "receipts" },
  { href: "/inbox", labelKey: "inbox" },
  { href: "/request", labelKey: "request" },
  { href: "/support", labelKey: "support" },
];

export const employerNav: NavItem[] = [
  { href: "/worker", labelKey: "worker" },
  { href: "/worker/inbox", labelKey: "inbox" },
];

export const overviewStats = [
  { label: "Active workers", value: "126" },
  { label: "Response time", value: "2 min" },
  { label: "Bookings today", value: "84" },
  { label: "Gross revenue", value: "$18.4k" },
];

export const quickActions = [
  {
    href: "/discover",
    title: "Find help now",
    description: "Search nearby pros by live availability, price, and trust score.",
  },
  {
    href: "/bookings",
    title: "Manage bookings",
    description: "Track jobs, receipts, chat threads, and support from one place.",
  },
  {
    href: "/worker",
    title: "Run worker ops",
    description: "Set availability, accept jobs, manage payouts, and protect idle time.",
  },
  {
    href: "/admin",
    title: "Operate the platform",
    description: "Verify workers, resolve disputes, and monitor commission health.",
  },
];

export const serviceCategories = [
  "Emergency plumbing",
  "Electrical repairs",
  "Deep cleaning",
  "Painting",
  "Furniture assembly",
  "AC servicing",
  "Appliance repair",
  "Pest control",
];

export const nearbyWorkers: WorkerProfile[] = [
  {
    name: "Maya Chen",
    role: "Licensed plumber",
    rate: "$32/hr",
    eta: "12 min away",
    area: "Central district",
    rating: "4.9",
    completedJobs: 184,
    availability: "Available now",
    tags: ["Leaks", "Water heaters", "Emergency"],
    blurb: "Fast diagnosis for urgent pipe failures and same-day repairs.",
  },
  {
    name: "David Okoro",
    role: "Electrician",
    rate: "$38/hr",
    eta: "Starts in 30 min",
    area: "Downtown",
    rating: "4.8",
    completedJobs: 142,
    availability: "Next slot 2:30 PM",
    tags: ["Rewiring", "Lighting", "Panels"],
    blurb: "Residential fixes, inspection work, and breaker troubleshooting.",
  },
  {
    name: "Ana Morales",
    role: "Cleaner",
    rate: "$24/hr",
    eta: "Today until 7 PM",
    area: "Northside",
    rating: "5.0",
    completedJobs: 226,
    availability: "Open today",
    tags: ["Move-out", "Kitchen", "Same-day"],
    blurb: "High-rated apartment resets and deep cleaning for urgent handovers.",
  },
  {
    name: "Samir Rahman",
    role: "Handyman",
    rate: "$29/hr",
    eta: "18 min away",
    area: "West end",
    rating: "4.7",
    completedJobs: 118,
    availability: "Available now",
    tags: ["Assembly", "Mounting", "Repairs"],
    blurb: "General home fixes, furniture assembly, and wall mounting jobs.",
  },
];

export const urgentRequests = [
  {
    title: "Burst pipe in apartment kitchen",
    area: "Maple Street",
    budget: "$60 - $90",
    window: "Immediate",
    status: "Matching now",
  },
  {
    title: "Power outage in one room",
    area: "Riverside block C",
    budget: "$45 - $80",
    window: "Within 1 hour",
    status: "3 electricians nearby",
  },
  {
    title: "Move-out deep clean",
    area: "Garden Heights",
    budget: "$70 flat",
    window: "Today, 5 PM",
    status: "Awaiting confirmation",
  },
];

export const bookingTimeline: BookingItem[] = [
  {
    service: "Kitchen pipe repair",
    worker: "Maya Chen",
    when: "Today, 3:30 PM",
    status: "Confirmed",
    address: "28 River Lane",
    price: "$60",
  },
  {
    service: "Ceiling light replacement",
    worker: "David Okoro",
    when: "Thu, 11:00 AM",
    status: "Pending worker reply",
    address: "9 Harbor View",
    price: "$52",
  },
  {
    service: "Move-out cleaning",
    worker: "Ana Morales",
    when: "Fri, 4:00 PM",
    status: "Paid",
    address: "71 Fern Street",
    price: "$70",
  },
];

export const messageThreads = [
  {
    name: "Maya Chen",
    preview: "I can arrive in 25 minutes. Do you have the shutoff valve accessible?",
    timestamp: "2m ago",
    unread: true,
  },
  {
    name: "David Okoro",
    preview: "The replacement fixture is included in the updated estimate.",
    timestamp: "18m ago",
    unread: false,
  },
  {
    name: "Support",
    preview: "Your receipt for booking #BEE-4027 is ready to download.",
    timestamp: "1h ago",
    unread: false,
  },
];

export const paymentHistory = [
  {
    label: "Booking #BEE-4027",
    amount: "$60",
    detail: "Kitchen pipe repair",
    state: "Paid",
  },
  {
    label: "Booking #BEE-4011",
    amount: "$52",
    detail: "Light replacement",
    state: "Escrow",
  },
  {
    label: "Refund request #BEE-3974",
    amount: "$18",
    detail: "Cleaning supplies adjustment",
    state: "Under review",
  },
];

export const customerMetrics = [
  { label: "Nearby available", value: "18" },
  { label: "Open chats", value: "4" },
  { label: "Saved pros", value: "9" },
  { label: "Wallet credits", value: "$24" },
];

export const workerMetrics = [
  { label: "Jobs today", value: "6" },
  { label: "Acceptance rate", value: "91%" },
  { label: "This week", value: "$1,240" },
  { label: "Rating", value: "4.9" },
];

export const workerSchedule = [
  {
    time: "09:00 AM",
    title: "AC servicing",
    customer: "Nina Patel",
    state: "On route",
  },
  {
    time: "11:30 AM",
    title: "Cabinet hinge repair",
    customer: "Jonas Bell",
    state: "Confirmed",
  },
  {
    time: "02:00 PM",
    title: "TV wall mount",
    customer: "Lara Kim",
    state: "Awaiting materials",
  },
  {
    time: "05:30 PM",
    title: "Evening availability slot",
    customer: "Open for booking",
    state: "Unbooked",
  },
];

export const workerLeads = [
  {
    title: "Assemble office desk",
    payout: "$42",
    distance: "2.1 mi",
    fit: "High match",
  },
  {
    title: "Door lock replacement",
    payout: "$65",
    distance: "3.4 mi",
    fit: "Verified customer",
  },
  {
    title: "Wall patch and paint",
    payout: "$78",
    distance: "4.0 mi",
    fit: "Tomorrow morning",
  },
];

export const availabilityMatrix = [
  { day: "Mon", hours: "9 AM - 5 PM" },
  { day: "Tue", hours: "1 PM - 8 PM" },
  { day: "Wed", hours: "8 AM - 6 PM" },
  { day: "Thu", hours: "9 AM - 4 PM" },
  { day: "Fri", hours: "10 AM - 7 PM" },
  { day: "Sat", hours: "Emergency only" },
];

export const workerReviews = [
  {
    customer: "Avery Mills",
    quote: "Arrived early, explained the fix, and closed the job in under an hour.",
  },
  {
    customer: "Noah Reed",
    quote: "Great communication in chat and very fair final pricing.",
  },
];

export const adminMetrics = [
  { label: "Pending verifications", value: "17" },
  { label: "Open disputes", value: "5" },
  { label: "Commission today", value: "$1,860" },
  { label: "Chargeback risk", value: "Low" },
];

export const verificationQueue = [
  {
    name: "Priya Nair",
    skill: "Electrician",
    documents: "License, ID, insurance",
    state: "Ready to approve",
  },
  {
    name: "Leo Carter",
    skill: "Painter",
    documents: "ID, portfolio",
    state: "Need skill proof",
  },
  {
    name: "Fatima Ali",
    skill: "Cleaner",
    documents: "ID, address verification",
    state: "Background check running",
  },
];

export const disputeQueue = [
  {
    booking: "#BEE-3981",
    issue: "Customer claims incomplete cleaning",
    amount: "$24",
    state: "Awaiting photos",
  },
  {
    booking: "#BEE-3974",
    issue: "Worker requested materials surcharge",
    amount: "$18",
    state: "Admin review",
  },
  {
    booking: "#BEE-3952",
    issue: "Missed arrival window",
    amount: "$12 credit",
    state: "Compensation drafted",
  },
];

export const cityPulse = [
  { zone: "Central", liveJobs: 24, availableWorkers: 11 },
  { zone: "Northside", liveJobs: 17, availableWorkers: 9 },
  { zone: "Downtown", liveJobs: 31, availableWorkers: 12 },
  { zone: "West end", liveJobs: 13, availableWorkers: 8 },
];
