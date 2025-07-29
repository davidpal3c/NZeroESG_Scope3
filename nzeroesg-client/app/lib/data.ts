
import ContentPasteSearchRoundedIcon from '@mui/icons-material/ContentPasteSearchRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import LocalPoliceRoundedIcon from '@mui/icons-material/LocalPoliceRounded';
import CompostRoundedIcon from '@mui/icons-material/CompostRounded';
import WebhookRoundedIcon from '@mui/icons-material/WebhookRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';

export const featuresData = [
    {
        "id": 1,
        "title": "Shipping Emissions",
        "icon": "",
        "description": "Estimate, and visualize CO₂ impact of shipping goods across modes (air, ship, train, truck).",
    },
    {
        "id": 2, 
        "title": "Supplier Comparison",
        "icon": "",
        "description": "Compare transport modes or regional vendors by their carbon footprint, helping you make informed decisions.",
    },
    {
        "id": 3,
        "title": "Conversational Carbon AI",
        "icon": "",
        "description": "Ask natural questions like: “What’s the carbon emission of shipping 300kg from Madrid to Berlin by train? What’s the best vendor if I want the lowest carbon + cost within 5 days delivery?",
    }
]



export const comingSoonData = [
    {
        "id": 1,
        "title": "Procurement Simulation Tool",
        // "icon": "📑",
        "icon": ContentPasteSearchRoundedIcon,
        "description": "Balance cost, emissions, and delivery time to simulate supplier decisions.",
    },
    {
        "id": 2,
        "title": "Upload POs or CSVs",
        // "icon": "📎",
        "icon": AttachFileRoundedIcon,
        "description": "Drop in your purchase orders and get a full emissions breakdown instantly.",
    },
    {
        "id": 3,
        "title": "ESG Policy Integration",
        // "icon": "📚",
        "icon": LocalPoliceRoundedIcon,
        "description": "Use vector search to ground agent answers in your company’s ESG policies.",
    },
    {
        "id": 4,
        "title": "Vendor Compliance Checker",
        // "icon": "🧠",
        "icon": CompostRoundedIcon,
        "description": "Match supplier data against sustainability criteria using automated AI compliance checks.",
    },
    {
        id: 5,
        title: "API for Embeddable Assistant Interface",
        // icon: "🔌",
        icon: WebhookRoundedIcon,
        description: "Enable 3rd-party integration of the carbon assistant with secure API keys."
    },
    {
        id: 6,
        title: "User Dashboard & ESG Document Portal",
        // icon: "📂",
        icon: DashboardRoundedIcon,
        description: "Manage documents, policies, and emissions reports in one ESG-aware interface."
    }
]


// export const featuresData = {
//     "nzeroesg": {
//         "name": "nZeroesG",
//         "description": "A tool for analyzing and visualizing zeroes in datasets.",
//         "version": "1.0.0",
//         "author": "David Palacios",
//         "license": "",
//         "repository": ""
//     },
//     "nzeroesg-scope3": {
//         "name": "nZeroesG Scope 3",
//         "description": "A tool for analyzing and visualizing Scope 3 emissions data.",
//         "version": "1.0.0",
//         "author": "David Palacios",
//         "license": "MIT",
//         "repository": ""
//     }
// }
