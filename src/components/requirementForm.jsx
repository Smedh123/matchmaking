import { useState } from "react";
import { getCoordinatesFromPlaceName } from "../helper/locationUtils";

const RequirementForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    budgetMin: "",
    budgetMax: "",
    minSBA: "",
    config: "",
    assetType: "",
    location: "",
    name: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const { lat, lng } = await getCoordinatesFromPlaceName(formData.location);

  const parsed = {
    priceMin: Number(formData.budgetMin),
    priceMax: Number(formData.budgetMax),
    sba: Number(formData.minSBA),
    config: formData.config,
    assetType: formData.assetType,
    locationName: formData.location,
    latitude: lat,
    longitude: lng,
    PropertyName: formData.name,
  };

  onSubmit(parsed);
};

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-w-md p-4 border rounded-xl shadow"
    >
      <div>
        <label className="block text-sm font-medium">Budget (in Lakhs)</label>
        <div className="flex gap-2">
          <input
            type="number"
            name="budgetMin"
            placeholder="Min"
            value={formData.budgetMin}
            onChange={handleChange}
            className="w-1/2 border px-2 py-1 rounded"
          />
          <input
            type="number"
            name="budgetMax"
            placeholder="Max"
            value={formData.budgetMax}
            onChange={handleChange}
            className="w-1/2 border px-2 py-1 rounded"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Area (sqft)</label>
        <input
          type="number"
          name="minSBA"
          value={formData.minSBA}
          onChange={handleChange}
          className="w-full border px-2 py-1 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Configuration</label>
        <input
          type="text"
          name="config"
          placeholder="e.g. 2 BHK"
          value={formData.config}
          onChange={handleChange}
          className="w-full border px-2 py-1 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Asset Type</label>
        <select
          name="assetType"
          value={formData.assetType}
          onChange={handleChange}
          className="w-full border border-gray-300 px-2 py-1 rounded  focus:outline-none focus:ring-2 focus:text-gray-700"
        >
          <option value="">Select...</option>
          <option value="apartment">Apartment</option>
          <option value="independent building">Independent Building</option>
          <option value="villa">Villament</option>
          <option value="row house">Row House</option>
          <option value="plot">Plot</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Location</label>
        <input
          type="text"
          name="location"
          placeholder="e.g. Whitefield"
          value={formData.location}
          onChange={handleChange}
          className="w-full border px-2 py-1 rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Property Name</label>
        <input
          type="text"
          name="location"
          placeholder="e.g. Prestige Shantiniketan"
          value={formData.name}
          onChange={handleChange}
          className="w-full border px-2 py-1 rounded"
        />
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Match Properties
      </button>
    </form>
  );
};

export default RequirementForm;
