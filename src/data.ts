import { Ticket, Stage } from "./types";

const ago = (days: number, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};
const dateIn = (days: number, hour = 18) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};
const stages: Stage[] = ["Discussion", "Development", "QA", "Deployment", "Sign-off"];
const checklist = () => [
  { id: "c1", label: "QA approval recorded", required: true, checked: false },
  { id: "c2", label: "No open critical defects", required: true, checked: false },
  { id: "c3", label: "Minor defects resolved or accepted", required: true, checked: false },
  { id: "c4", label: "Code review completed", required: true, checked: false },
  { id: "c5", label: "Database migration reviewed", required: true, checked: false },
  { id: "c6", label: "Environment configuration verified", required: true, checked: false },
  { id: "c7", label: "API compatibility checked", required: true, checked: false },
  { id: "c8", label: "Smoke test plan prepared", required: true, checked: false },
  { id: "c9", label: "Rollback plan documented", required: true, checked: false },
  { id: "c10", label: "Deployment notes completed", required: true, checked: false }
];

export const seedTickets: Ticket[] = [
  {
    id: "DEV-1048", title: "Add carrier surcharge rule validation", description: "Validate provider surcharge rules against package dimensions and destination country. Return clear validation messages and prevent invalid rate calculation.", project: "ShipGlobal", module: "Rate Engine", assignee: "Suyogya Mishra", qaOwner: "Ananya Sharma", priority: "High", stage: "QA", createdAt: ago(5), eta: dateIn(-1), originalEta: dateIn(-1), estimateHours: 12, complexity: "Large", acceptanceCriteria: ["Country-specific rules are applied only to matching destinations.", "Boundary values are rounded consistently.", "Invalid dimensions return a clear message."], blockedHours: 0, comments: [{id:"e1",at:ago(5),actor:"Suyogya Mishra",title:"Ticket created",detail:"Requirement added by project manager."},{id:"e2",at:ago(4),actor:"Suyogya Mishra",title:"Moved to Development",detail:"Confirmed rule evaluation order and country-specific behavior."},{id:"e3",at:ago(1),actor:"Suyogya Mishra",title:"Moved to QA",detail:"Implemented validation and added unit tests. Please verify DE and non-DE lanes."}], bugs: [{id:"BUG-221",title:"Boundary value message is inconsistent",severity:"Minor",status:"Open",attribution:"Development",createdAt:ago(0),notes:"For 72.1 cm, validation message differs from vendor rule."}], checklist: checklist(), deploymentNotes:"", deploymentEnvironment:"Production"
  },
  {
    id: "DEV-1047", title: "Create DHL manifested orders audit log", description: "Persist manifested order references and support reliable unsetting of offloaded orders with an audit trail.", project: "ShipGlobal", module: "Manifest", assignee: "Suyogya Mishra", qaOwner: "Ananya Sharma", priority: "Critical", stage: "Development", createdAt: ago(3), eta: dateIn(2), originalEta: dateIn(2), estimateHours: 16, complexity: "XL", acceptanceCriteria: ["Manifested order IDs are stored once.", "Unset operation is transactional.", "Audit history records who changed the state."], blockedHours: 4, blockedReason:"Waiting for schema confirmation", comments:[{id:"e4",at:ago(3),actor:"Suyogya Mishra",title:"Moved to Development",detail:"Schema and transaction approach agreed."}], bugs:[], checklist:checklist(), deploymentNotes:"", deploymentEnvironment:"Production"
  },
  {
    id: "DEV-1046", title: "Update shipment tracking response", description: "Normalize tracking response fields across carrier integrations and provide a consistent event timeline.", project: "ShipWave", module: "Tracking API", assignee: "Suyogya Mishra", qaOwner: "Rahul Verma", priority: "Medium", stage: "Sign-off", createdAt: ago(9), eta: dateIn(-3), originalEta: dateIn(-3), estimateHours: 8, complexity: "Medium", acceptanceCriteria: ["Events are sorted chronologically.", "Unknown carrier statuses are safely mapped.", "Response remains backward compatible."], blockedHours:0, comments:[{id:"e5",at:ago(9),actor:"Suyogya Mishra",title:"Ticket created",detail:"Tracking response enhancement."},{id:"e6",at:ago(7),actor:"Suyogya Mishra",title:"Moved to QA",detail:"Mapping and fallback behavior implemented."},{id:"e7",at:ago(4),actor:"Suyogya Mishra",title:"Moved to Deployment",detail:"QA passed. Deployment notes added."},{id:"e8",at:ago(2),actor:"Suyogya Mishra",title:"Moved to Sign-off",detail:"Deployed to staging and smoke tests passed."}], bugs:[{id:"BUG-217",title:"Status label capitalization",severity:"Cosmetic",status:"Resolved",attribution:"Development",createdAt:ago(6),notes:"Adjusted label formatting."}], checklist: checklist().map(x=>({...x,checked:true})), deploymentNotes:"Deployed to staging. API contract unchanged. Smoke test passed.", deploymentEnvironment:"Staging", signoffComment:"Awaiting business confirmation"
  },
  {
    id: "DEV-1045", title: "Improve vendor zone CSV import", description: "Validate duplicate zones and postcode mappings before replacing provider zone data.", project: "ShipGlobal", module: "Provider Zones", assignee: "Suyogya Mishra", qaOwner: "Rahul Verma", priority: "High", stage: "Sign-off", createdAt: ago(14), eta: dateIn(-8), originalEta: dateIn(-8), estimateHours: 10, complexity: "Large", acceptanceCriteria: ["Duplicate zone names are rejected.", "Invalid postcodes are reported by row.", "Replace operation rolls back on failure."], blockedHours:0, comments:[{id:"e9",at:ago(14),actor:"Suyogya Mishra",title:"Ticket created",detail:"CSV import enhancement."}], bugs:[{id:"BUG-211",title:"Error text should mention CSV row",severity:"Minor",status:"Resolved",attribution:"Development",createdAt:ago(10),notes:"Added row number to validation error."},{id:"BUG-212",title:"Button spacing",severity:"Cosmetic",status:"Resolved",attribution:"Development",createdAt:ago(10),notes:"Minor visual correction."}], checklist: checklist().map(x=>({...x,checked:true})), deploymentNotes:"CSV validation deployed. Rollback available through previous zone snapshot.", deploymentEnvironment:"Production", signoffComment:"Accepted by product owner"
  },
  {
    id: "DEV-1044", title: "Add customer billing profile endpoint", description: "Expose billing profile information with validation and role-based access.", project: "Billing App", module: "Customer API", assignee: "Suyogya Mishra", qaOwner: "Ananya Sharma", priority: "Medium", stage: "Discussion", createdAt: ago(1), eta: dateIn(5), originalEta: dateIn(5), estimateHours: 6, complexity: "Small", acceptanceCriteria: ["Only authorized users can access profile.", "Missing billing address returns validation response."], blockedHours:0, comments:[], bugs:[], checklist:checklist(), deploymentNotes:"", deploymentEnvironment:"Staging"
  },
  {
    id: "DEV-1043", title: "Fix order creation failure on retry", description: "Ensure idempotent order creation when a client retries after a network timeout.", project: "ShipWave", module: "Orders", assignee: "Suyogya Mishra", qaOwner: "Rahul Verma", priority: "Critical", stage: "Sign-off", createdAt: ago(18), eta: dateIn(-12), originalEta: dateIn(-12), estimateHours: 14, complexity: "XL", acceptanceCriteria: ["Duplicate order is not created for same idempotency key.", "Retry returns original order reference."], blockedHours:0, comments:[], bugs:[{id:"BUG-203",title:"Order flow fails when retry token expires",severity:"Critical",status:"Resolved",attribution:"Development",createdAt:ago(14),notes:"Fixed token validation and added regression coverage."}], checklist:checklist().map(x=>({...x,checked:true})), deploymentNotes:"Idempotency guard deployed and verified.", deploymentEnvironment:"Production", signoffComment:"Approved after regression testing"
  }
];