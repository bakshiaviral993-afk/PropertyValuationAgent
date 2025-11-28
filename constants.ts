import { StepField, WizardStep } from './types';

export const WIZARD_STEPS: WizardStep[] = [
  {
    field: StepField.State,
    question: "Welcome to the Valuation Tech App. Let's begin. Please enter the State.",
    type: 'text',
    placeholder: 'e.g., Maharashtra'
  },
  {
    field: StepField.City,
    question: "Please enter the City.",
    type: 'text',
    placeholder: 'e.g., Pune'
  },
  {
    field: StepField.Pincode,
    question: "Please enter the Pincode.",
    type: 'text',
    placeholder: 'e.g., 411014'
  },
  // District is auto-populated internally
  {
    field: StepField.Area,
    question: "Please confirm or enter your Locality/Area.",
    type: 'text',
    placeholder: 'e.g., Wagholi'
  },
  {
    field: StepField.ProjectName,
    question: "What is the Project Name?",
    type: 'text',
    placeholder: 'e.g., Godrej Horizon'
  },
  {
    field: StepField.BuilderName,
    question: "What is the Builder Name?",
    type: 'text',
    placeholder: 'e.g., Godrej Properties'
  },
  {
    field: StepField.BHK,
    question: "What is the configuration (e.g., 2 BHK, 3 BHK)?",
    type: 'text',
    placeholder: 'e.g., 2 BHK'
  },
  {
    field: StepField.Facing,
    question: "What is the Facing of the property?",
    type: 'select',
    options: ['North', 'East', 'West', 'South']
  },
  {
    field: StepField.Floor,
    question: "Number of floors in the building (or floor number)?",
    type: 'number',
    placeholder: 'e.g., 10'
  },
  {
    field: StepField.ConstructionYear,
    question: "What is the Construction Year?",
    type: 'number',
    placeholder: 'e.g., 2020'
  },
  {
    field: StepField.DistanceFromMainRoad,
    question: "What is the distance from the main road (in km or meters)?",
    type: 'text',
    placeholder: 'e.g., 500 meters'
  },
  {
    field: StepField.RoadType,
    question: "What is the Type of Road?",
    type: 'select',
    options: ['Tar Road', 'Concrete Road', 'Mud Road', 'Paver Blocks']
  },
  {
    field: StepField.NearbyLocations,
    question: "Enter nearby positive locations (Schools, Colleges, Hospitals, Shops).",
    type: 'text',
    placeholder: 'e.g., Vibgyor School, Apollo Hospital'
  },
  {
    field: StepField.CarpetArea,
    question: "Enter Carpet Area (sqft).",
    type: 'number',
    placeholder: 'e.g., 900'
  },
  {
    field: StepField.BuiltUpArea,
    question: "Enter Built-up Area (sqft).",
    type: 'number',
    placeholder: 'e.g., 1100'
  },
  {
    field: StepField.SuperBuiltUpArea,
    question: "Enter Super Built-up Area (sqft).",
    type: 'number',
    placeholder: 'e.g., 1350'
  },
  {
    field: StepField.HasParking,
    question: "Is Car Parking available?",
    type: 'select',
    options: ['Yes', 'No']
  },
  {
    field: StepField.ParkingCharges,
    question: "Please enter the Parking Charges.",
    type: 'number',
    placeholder: 'e.g., 500000'
  },
  {
    field: StepField.HasAmenities,
    question: "Are there Amenities?",
    type: 'select',
    options: ['Yes', 'No']
  },
  {
    field: StepField.AmenitiesCharges,
    question: "Please enter the Amenities Charges.",
    type: 'number',
    placeholder: 'e.g., 300000'
  },
  {
    field: StepField.FSI,
    question: "What is the FSI (Floor Space Index)?",
    type: 'number',
    placeholder: 'e.g., 2.5'
  }
];

export const INITIAL_VALUATION_REQUEST = {
  state: '',
  city: '',
  pincode: '',
  district: '',
  area: '',
  projectName: '',
  builderName: '',
  bhk: '',
  facing: '',
  floor: 0,
  constructionYear: new Date().getFullYear(),
  distanceFromMainRoad: '',
  roadType: '',
  nearbyLocations: '',
  carpetArea: 0,
  builtUpArea: 0,
  superBuiltUpArea: 0,
  hasParking: 'No',
  parkingCharges: 0,
  hasAmenities: 'No',
  amenitiesCharges: 0,
  fsi: 0
};