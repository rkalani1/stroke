export const topics = [
  {
    "id": "extended-window-ivt",
    "label": "Extended-window IV thrombolysis",
    "parentId": "acute-ischemic-stroke",
    "notes": ""
  },
  {
    "id": "tnk-vs-alteplase",
    "label": "Tenecteplase vs alteplase",
    "parentId": "acute-ischemic-stroke",
    "notes": ""
  },
  {
    "id": "evt-large-core",
    "label": "EVT for large-core infarct",
    "parentId": "acute-ischemic-stroke",
    "notes": ""
  },
  {
    "id": "evt-late-window",
    "label": "EVT in late window (6-24h)",
    "parentId": "acute-ischemic-stroke",
    "notes": ""
  },
  {
    "id": "bp-post-evt",
    "label": "Blood pressure target after EVT",
    "parentId": "acute-ischemic-stroke",
    "notes": ""
  },
  {
    "id": "ich-bp-management",
    "label": "ICH blood pressure management",
    "parentId": "ich",
    "notes": ""
  },
  {
    "id": "ich-anticoag-reversal",
    "label": "Anticoagulant-associated ICH reversal",
    "parentId": "ich",
    "notes": ""
  },
  {
    "id": "ich-surgery",
    "label": "ICH surgical evacuation",
    "parentId": "ich",
    "notes": ""
  },
  {
    "id": "dapt-minor-stroke",
    "label": "DAPT for minor stroke / high-risk TIA",
    "parentId": "secondary-prevention",
    "notes": ""
  }
];

const byId = new Map(topics.map(record => [record.id, record]));
export function getTopic(id) { return byId.get(id) || null; }
export function getAllTopicIds() { return new Set(byId.keys()); }
export function topicLabel(id) { return getTopic(id)?.label || id; }
