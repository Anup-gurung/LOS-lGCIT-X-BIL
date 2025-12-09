// Central place to store marketing copy for loan types
export type LoanInfoContent = {
  title: string
  tagline: string
  highlightTitle: string
  description: string
}

export const loanInfoContent: Record<string, LoanInfoContent> = {
  // Agriculture and Livestock (id "1")
  "1": {
    title: "Agriculture and Livestock",
    tagline: "~ \"Sow the Seeds of Prosperity, Reap the Rewards.\"",
    highlightTitle: "Agriculture and Livestock",
    description: "Cultivate your agricultural and livestock ventures with specialized loans for farm expansion, equipment purchase, and sustainable practices.",
  },
  // Production & Manufacturing (id "2")
  "2": {
    title: "Production & Manufacturing Loan",
    tagline: "~ \"Empower Your Production, Transform Your Business.\"",
    highlightTitle: "Production & Manufacturing Loan",
    description: "Fuel your business growth with tailored financing solutions for production and manufacturing needs, from equipment purchase to operational expansion.",
  },
  // Hotel & Tourism (id "3")
  "3": {
    title: "Hotel & Tourism Loan",
    tagline: "~ \"Check-In to Success, Embark on New Journeys.\"",
    highlightTitle: "Hotel & Tourism Loan",
    description: "Transform your hospitality dreams into reality with customized loans for hotel and tourism ventures, from property development to service enhancement.",
  },
  // Trade & Commerce (id "4")
  "4": {
    title: "Trade & Commerce Loan",
    tagline: "~ \"Trade Up Your Business, Commerce with Confidence.\"",
    highlightTitle: "Trade & Commerce Loan",
    description: "Elevate your trade and commerce ventures with flexible funding options designed to boost inventory, expand operations, and seize market opportunities.",
  },
  // Housing Loan (id "6")
  "6": {
    title: "Housing Loan",
    tagline: "~ \"Foundation for Your Future, Key to Your Dreams.\"",
    highlightTitle: "Housing Loan",
    description: "Turn your dream home into a reality with flexible housing loans, and customizable repayment options.",
  },
  // Transport Loan (id "7")
  "7": {
    title: "Transport Loan",
    tagline: "~ \"Fuel Your Fleet, Accelerate Your Success.\"",
    highlightTitle: "Transport Commercial Loan",
    description: "Drive your commercial transport business forward with financing solutions for vehicle purchase, and operational upgrades.",
  },
  // Personal Loan (id "8")
  "8": {
    title: "Personal Loan",
    tagline: "~ \"Leverage Your Assets, Realize Your Goals.\"",
    highlightTitle: "Personal Mortgaged Loan",
    description: "Unlock the value of your assets with personal mortgaged loans, and flexible repayment terms for financial freedom.",
  },
  // Loan for Shares & Securities (id "13")
  "13": {
    title: "Loan for Shares & Securities",
    tagline: "~ \"Invest in Your Future, Secure Your Success.\"",
    highlightTitle: "Loan for Shares & Securities",
    description: "Amplify your investment portfolio with loans for shares and securities, providing the leverage you need to capitalize on market opportunities.",
  },
  // Loans to Contractors (id "14")
  "14": {
    title: "Loans to Contractors",
    tagline: "~ \"Construct Your Dreams, Cement Your Success.\"",
    highlightTitle: "Loans to Contractors",
    description: "Build a solid foundation for your contracting business with dedicated loans for project financing, equipment procurement, and working capital.",
  },
  // Forestry & Logging Loan (id "15")
  "15": {
    title: "Forestry & Logging Loan",
    tagline: "~ \"Harvest Success, Plant Prosperity.\"",
    highlightTitle: "Forestry & Logging Loan",
    description: "Sustainable financing for forestry and logging enterprises, supporting equipment acquisition, and environmental conservation efforts.",
  },
  // Mining & Quarrying Loan (id "16")
  "16": {
    title: "Mining & Quarrying Loan",
    tagline: "~ \"Unearth Potential, Quarry New Opportunities.\"",
    highlightTitle: "Mining & Quarrying Loan",
    description: "Dig deeper into success with specialized loans for mining and quarrying projects, covering exploration, equipment, and operational expansion.",
  },
  // Service Sector Loan (id "17")
  "17": {
    title: "Service Sector Loan",
    tagline: "~ \"Serve Better, Grow Stronger.\"",
    highlightTitle: "Service Sector Loan",
    description: "Propel your service-oriented business forward with tailored financing solutions for expansion, technology upgrades, and quality improvement.",
  },
  // Fallback copy if no specific loan type match is found
  default: {
    title: "Loan Details",
    tagline: "Choose the product that fits your need.",
    highlightTitle: "Flexible Financing",
    description: "Select a loan type to view tailored information and requirements.",
  },
}