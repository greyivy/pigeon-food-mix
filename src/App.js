import { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import foods from './foods.js';
import { calculateIdealMix } from './calculate.js';

// Ideal nutritional percentages
const IDEAL = { protein: 18, fat: 12, fiber: 8 };

function App() {
  const [protein, setProtein] = useState(IDEAL.protein)
  const [fat, setFat] = useState(IDEAL.fat)
  const [fiber, setFiber] = useState(IDEAL.fiber)

  const [maxParts, setMaxParts] = useState(8);

  const [result, setResult] = useState({ foods: [], nutrition: { protein: 0, fat: 0, fiber: 0 } });

  const [enabledFoods, setEnabledFoods] = useState(foods.reduce((acc, food) => {
    acc[food.name] = false;
    return acc;
  }, {}));

  useEffect(() => {
    async function fetchResult() {
      const calculatedResult = await calculateIdealMix({ protein, fat, fiber }, foods.filter((food) => enabledFoods[food.name]), maxParts);
      setResult(calculatedResult);
    }
    fetchResult();
  }, [protein, fat, fiber, maxParts, enabledFoods]);

  return (
    <div className="App" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: '12px', padding: '12px' }}>
      <div style={{ flex: '1 1 auto' }}>
        <h1>Desired</h1>

        <div style={{ display: 'flex', flexDirection: 'row', gap: '12px' }}>
          <label>
            Protein (%):
            <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} min={0} max={100} />
          </label>
          <label>
            Fat (%):
            <input type="number" value={fat} onChange={(e) => setFat(e.target.value)} min={0} max={100} />
          </label>
          <label>
            Fiber (%):
            <input type="number" value={fiber} onChange={(e) => setFiber(e.target.value)} min={0} max={100} />
          </label>
        </div>

        <table>
          <thead>
            <tr>
              <th>Enable</th>
              <th>Food</th>
              <th>Protein</th>
              <th>Fat</th>
              <th>Fiber</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(enabledFoods).map(([food, enabled]) => (
              <tr key={food}>
                <td>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => {
                      setEnabledFoods({ ...enabledFoods, [food]: e.target.checked });
                    }}
                  />
                </td>
                <td>{food}</td>
                <td>{foods.find((f) => f.name === food).protein}</td>
                <td>{foods.find((f) => f.name === food).fat}</td>
                <td>{foods.find((f) => f.name === food).fiber}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ flex: '1 1 auto' }}>
        <h1>Result</h1>

        <div style={{ display: 'flex', flexDirection: 'row', gap: '12px' }}>
          <label>
            Max Parts:
            <input type="number" value={maxParts} onChange={(e) => setMaxParts(e.target.value)} min={1} />
          </label>

          <label>
            Protein (%):
            <input type="number" value={result.nutrition.protein.toFixed(1)} readOnly />
          </label>
          <label>
            Fat (%):
            <input type="number" value={result.nutrition.fat.toFixed(1)} readOnly />
          </label>
          <label>
            Fiber (%):
            <input type="number" value={result.nutrition.fiber.toFixed(1)} readOnly />
          </label>
        </div>

        <table>
          <thead>
            <tr>
              <th>Food</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(result.foods).map(([food, amount]) => (
              <tr key={food}>
                <td>{food}</td>
                <td>{amount} part(s)</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
