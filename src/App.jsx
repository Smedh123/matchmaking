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
    console.log("Match details:", match);
    const property = await fetchPropertyById(match.id);
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
                onClick={() => handleClick(match)}
                className="border p-3 rounded cursor-pointer hover:border-gray-500"
              >
                <div className="font-medium">
                  🏷️ {match.id} — 🔢 Score: {match.score.toFixed(2)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
