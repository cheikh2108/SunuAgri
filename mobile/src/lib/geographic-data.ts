export interface PickerOption {
  label: string;
  value: string;
}

export const REGIONS: PickerOption[] = [
  { label: "Dakar", value: "Dakar" },
  { label: "Thiès", value: "Thiès" },
  { label: "Diourbel", value: "Diourbel" },
  { label: "Fatick", value: "Fatick" },
  { label: "Kaolack", value: "Kaolack" },
  { label: "Kaffrine", value: "Kaffrine" },
  { label: "Louga", value: "Louga" },
  { label: "Matam", value: "Matam" },
  { label: "Saint-Louis", value: "Saint-Louis" },
  { label: "Sédhiou", value: "Sédhiou" },
  { label: "Tambacounda", value: "Tambacounda" },
  { label: "Kédougou", value: "Kédougou" },
  { label: "Kolda", value: "Kolda" },
  { label: "Ziguinchor", value: "Ziguinchor" },
];

export const DEPARTMENTS: Record<string, PickerOption[]> = {
  Dakar: [
    { label: "Dakar", value: "Dakar" },
    { label: "Pikine", value: "Pikine" },
    { label: "Guédiawaye", value: "Guédiawaye" },
    { label: "Rufisque", value: "Rufisque" },
  ],
  Thiès: [
    { label: "Thiès", value: "Thiès" },
    { label: "Mbour", value: "Mbour" },
    { label: "Tivaouane", value: "Tivaouane" },
  ],
};

export const COMMUNES: Record<string, PickerOption[]> = {
  Dakar: [
    { label: "Dakar Plateau", value: "Dakar Plateau" },
    { label: "Médina", value: "Médina" },
    { label: "HLM", value: "HLM" },
  ],
  Thiès: [
    { label: "Thiès Nord", value: "Thiès Nord" },
    { label: "Thiès Est", value: "Thiès Est" },
    { label: "Thiès Ouest", value: "Thiès Ouest" },
  ],
  Mbour: [
    { label: "Mbour", value: "Mbour" },
    { label: "Saly", value: "Saly" },
  ],
};
