import "./App.css";
import { useEffect, useState } from "react";
import { fetchProperties, fetchPropertyById } from "./helper/Fetchers.js";
import RequirementForm from "./components/requirementForm.jsx";
import { getMatchScore } from "./helper/MatchingScore.js";

function App() {
  const [rankedMatches, setRankedMatches] = useState([]);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const properties = await fetchProperties();
        setProperties(properties);
      } catch (err) {
        console.error("Error fetching properties:", err);
      }
    };
    fetchData();
  }, []);

  const Matching = async (requirement) => {
    // Map properties to promises since getMatchScore is now async
    const matchPromises = properties.map(async (property) => {
      const scoreResult = await getMatchScore(requirement, property); // Await needed here
      return scoreResult !== null
        ? {
            id: property.id,
            assetType: property.assetType || "Unknown",
            score: scoreResult.total,
            breakdown: scoreResult.breakdown,
            actualScore: scoreResult.actualScore,
            possibleScore: scoreResult.possibleScore,
          }
        : null;
    });

    // Wait for all scores to resolve
    const resolvedMatches = await Promise.all(matchPromises);

    // Filter valid matches and sort
    const sorted = resolvedMatches
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);

    setRankedMatches(sorted);
  };

  const handleClick = async (match) => {
    setLoading(true);
    setIsModalOpen(true);
    
    try {
      const property = await fetchPropertyById(match.id);
      console.log("Raw property data:", property); // Debug log
      setSelectedProperty({ ...property, matchDetails: match });
    } catch (error) {
      console.error("Error fetching property details:", error);
      setSelectedProperty(null);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProperty(null);
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return "Not available";
    return `₹${price} Lakhs`;
  };

  const formatArea = (area) => {
    if (!area && area !== 0) return "Not available";
    return `${area} sq ft`;
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "Not available";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount * 100000); // Convert lakhs to rupees
  };

  const renderPropertyField = (label, value, type = "text") => {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    let displayValue = value;
    if (type === "price") {
      displayValue = formatPrice(value);
    } else if (type === "area") {
      displayValue = formatArea(value);
    } else if (type === "currency") {
      displayValue = formatCurrency(value);
    } else if (type === "boolean") {
      displayValue = value ? "Yes" : "No";
    } else if (typeof value === "object") {
      displayValue = JSON.stringify(value);
    }

    return (
      <div className="flex justify-between items-center py-2 border-b border-gray-100">
        <span className="font-medium text-gray-600 capitalize">{label.replace(/([A-Z])/g, ' $1').trim()}:</span>
        <span className="font-semibold text-gray-800 text-right">{displayValue}</span>
      </div>
    );
  };

  // FIX THIS
  const getPropertySections = () => {
    const sections = {
      basic: {
        title: "Basic Information",
        fields: [
          { key: "propertyId", label: "Property ID" },
          { key: "unitType", label: "Unit Type" },
          { key: "assetType", label: "Asset Type", type: "text" },
          { key: "totalAskPrice", label: "Total Ask Price", type: "price" },
          { key: "sbua", label: "SBUA", type: "area" },
          { key: "plotSize", label: "Plot Size", type: "area" },
        ]
      },
      location: {
        title: "Location Details",
        fields: [
          { key: "micromarket", label: "Micromarket" },
          { key: "city", label: "City" },
          { key: "state", label: "State" },
          { key: "pincode", label: "Pincode" },
        ]
      },
      financial: {
        title: "Financial Details",
        fields: [
          { key: "totalAskPrice", label: "Total Ask Price", type: "currency" },
          { key: "pricePerSqFt", label: "Price per Sq Ft", type: "currency" },
          { key: "maintenanceCharges", label: "Maintenance Charges", type: "currency" },
          { key: "bookingAmount", label: "Booking Amount", type: "currency" },
        ]
      },
      amenities: {
        title: "Amenities & Features",
        fields: [
          { key: "furnishingStatus", label: "Furnishing Status" },
          { key: "floorNumber", label: "Floor Number" },
          { key: "totalFloors", label: "Total Floors" },
          { key: "parking", label: "Parking" },
          { key: "balcony", label: "Balcony" },
          { key: "garden", label: "Garden" },
        ]
      }
    };

    return sections;
  };

  // Helper to render JSON as a collapsible tree
  function RenderJsonTree({ data, level = 0 }) {
    if (typeof data !== "object" || data === null) {
      return (
        <span className="text-blue-900">{JSON.stringify(data)}</span>
      );
    }
    if (Array.isArray(data)) {
      if (data.length === 0) return <span className="text-gray-500">[]</span>;
      // Special case: if this is a photo array, render images
      if (data.length > 0 && typeof data[0] === "string" && data[0].startsWith("http")) {
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 my-2">
            {data.map((url, idx) => (
              <a href={url} target="_blank" rel="noopener noreferrer" key={idx}>
                <img
                  src={url}
                  alt={`property-img-${idx}`}
                  className="rounded shadow border border-gray-200 object-cover w-full h-32"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        );
      }
      return (
        <div className="ml-4">
          [
          {data.map((item, idx) => (
            <div key={idx} className="ml-4">
              <RenderJsonTree data={item} level={level + 1} />
              {idx < data.length - 1 ? "," : ""}
            </div>
          ))}
          ]
        </div>
      );
    }
    return (
      <div className="ml-2">
        {"{"}
        {Object.entries(data).map(([key, value], idx, arr) => (
          <div key={key} className="ml-4">
            <span className="text-purple-800 font-semibold">{key}</span>
            <span className="text-black">: </span>
            <RenderJsonTree data={value} level={level + 1} />
            {idx < arr.length - 1 ? "," : ""}
          </div>
        ))}
        {"}"}
      </div>
    );
  }

  return (
    <div className="p-6">
      <RequirementForm onSubmit={Matching} />

      {rankedMatches.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Top Matches</h2>
          <ul className="space-y-2">
            {rankedMatches.map((match) => (
              <li
                key={match.id}
                onClick={() => handleClick(match)}
                className="border p-3 rounded cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="font-medium">
                  🏷️ {match.id} — 🔢 Score: {match.score.toFixed(2)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Enhanced Property Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-black">Property Details</h2>
                  {selectedProperty && (
                    <p className="text-black mt-1 font-medium">
                      ID: {selectedProperty.propertyId || selectedProperty.id}
                    </p>
                  )}
                </div>
                <button
                  onClick={closeModal}
                  className="text-black hover:text-gray-700 text-3xl font-bold transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {loading ? (
                <div className="flex flex-col justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <span className="text-black font-medium">Loading property details...</span>
                </div>
              ) : selectedProperty ? (
                <div className="space-y-6">
                  {/* Match Score Card */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
                    <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                      🎯 Match Score Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-black">
                          {selectedProperty.matchDetails.score.toFixed(2)}
                        </div>
                        <div className="text-sm text-black font-medium">Total Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-black">
                          {selectedProperty.matchDetails.actualScore}
                        </div>
                        <div className="text-sm text-black font-medium">Actual Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-black">
                          {selectedProperty.matchDetails.possibleScore}
                        </div>
                        <div className="text-sm text-black font-medium">Possible Score</div>
                      </div>
                    </div>
                  </div>

                  {/* Property Information Sections */}
                  {Object.entries(getPropertySections(selectedProperty)).map(([sectionKey, section]) => {
                    const validFields = section.fields.filter(field => 
                      selectedProperty[field.key] !== undefined && 
                      selectedProperty[field.key] !== null && 
                      selectedProperty[field.key] !== ""
                    );

                    if (validFields.length === 0) return null;

                    return (
                      <div key={sectionKey} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                          <h3 className="font-semibold text-black">{section.title}</h3>
                        </div>
                        <div className="p-6">
                          {validFields.map(field => 
                            renderPropertyField(field.label, selectedProperty[field.key], field.type)
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Location Coordinates */}
                  {selectedProperty._geoloc && (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                        <h3 className="font-semibold text-black">Geographic Location</h3>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-blue-50 rounded">
                            <div className="text-sm text-black font-medium">Latitude</div>
                            <div className="font-semibold text-black">{selectedProperty._geoloc.lat}</div>
                          </div>
                          <div className="text-center p-3 bg-blue-50 rounded">
                            <div className="text-sm text-black font-medium">Longitude</div>
                            <div className="font-semibold text-black">{selectedProperty._geoloc.lng}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Raw Data for Debugging */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                      <h3 className="font-semibold text-black">Complete Property Data</h3>
                    </div>
                    <div className="p-6">
                      <div className="bg-gray-50 p-4 rounded text-sm overflow-x-auto">
                        <RenderJsonTree data={selectedProperty} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-red-500 text-6xl mb-4">⚠️</div>
                  <h3 className="text-xl font-semibold text-black mb-2">Failed to Load Property Details</h3>
                  <p className="text-black font-medium">Please try again or check your connection.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
