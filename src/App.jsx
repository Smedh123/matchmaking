import "./App.css";
import { useEffect, useState } from "react";
import { fetchProperties, fetchPropertyById } from "./helper/Fetchers.js";
import RequirementForm from "./components/requirementForm.jsx";
import { getMatchScore } from "./helper/MatchingScore.js";

function App() {
  const [rankedMatches, setRankedMatches] = useState([]);
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const properties = await fetchProperties();
        console.log("Fetched properties:", properties);
        setProperties(properties);
      } catch (err) {
        console.error("Error fetching properties:", err);
      }
    };
    fetchData();
  }, []);

  const Matching = (requirement) => {
    const matches = properties.map((property) => {
      const score = getMatchScore(requirement, property);
      return {
        id: property.id,
        assetType: property.assetType || "Unknown",
        score,
      };
    });

    const sorted = matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 50); // Limit to top 50

    setRankedMatches(sorted);
  };

  const handleClick = async (id) => {
    const property = await fetchPropertyById(id);
    console.log("Clicked property:", property);
  };

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
                onClick={() => handleClick(match.id)}
                className="border p-3 rounded cursor-pointer hover:bg-gray-100"
              >
                <div className="font-medium">
                  🏷️ {match.assetType} — 🔢 Score: {match.score.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">ID: {match.id}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
