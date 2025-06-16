import { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import foods from './foods.js';
import { calculateIdealMix } from './calculate.js';

// Ideal nutritional percentages
const IDEAL = { protein: 18, fat: 12, fiber: 8 };
const STORAGE_KEY = 'pigeon-food-app-state-v1';

function App() {
  // Load from localStorage if available
  const getInitialState = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved) return null;
      return saved;
    } catch {
      return null;
    }
  };
  const initial = getInitialState();

  const [protein, setProtein] = useState(initial?.protein ?? IDEAL.protein);
  const [fat, setFat] = useState(initial?.fat ?? IDEAL.fat);
  const [fiber, setFiber] = useState(initial?.fiber ?? IDEAL.fiber);
  const [maxParts, setMaxParts] = useState(initial?.maxParts ?? 8);
  const [customFoods, setCustomFoods] = useState(initial?.customFoods ?? []);
  const [customForm, setCustomForm] = useState({ name: '', protein: '', fat: '', fiber: '' });
  const [formError, setFormError] = useState('');
  const allFoods = [...foods, ...customFoods];
  const [enabledFoods, setEnabledFoods] = useState(() => {
    if (initial?.enabledFoods) return initial.enabledFoods;
    const acc = {};
    foods.forEach(food => { acc[food.name] = false; });
    return acc;
  });

  // Add custom food
  const handleAddCustom = (e) => {
    e.preventDefault();
    const { name, protein, fat, fiber } = customForm;
    if (!name.trim() || isNaN(protein) || isNaN(fat) || isNaN(fiber)) {
      setFormError('Please fill all fields with valid values.');
      return;
    }
    if (allFoods.some(f => f.name.toLowerCase() === name.trim().toLowerCase())) {
      setFormError('A food with this name already exists.');
      return;
    }
    const newFood = {
      name: name.trim(),
      protein: Number(protein),
      fat: Number(fat),
      fiber: Number(fiber)
    };
    setCustomFoods([...customFoods, newFood]);
    setEnabledFoods({ ...enabledFoods, [newFood.name]: true });
    setCustomForm({ name: '', protein: '', fat: '', fiber: '' });
    setFormError('');
  };

  // Remove a custom food
  const handleDeleteCustom = (name) => {
    setCustomFoods(customFoods.filter(f => f.name !== name));
    setEnabledFoods(prev => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  };

  // Reset all state to default
  const handleReset = () => {
    setProtein(IDEAL.protein);
    setFat(IDEAL.fat);
    setFiber(IDEAL.fiber);
    setMaxParts(8);
    setCustomFoods([]);
    setCustomForm({ name: '', protein: '', fat: '', fiber: '' });
    setFormError('');
    setEnabledFoods(foods.reduce((acc, food) => {
      acc[food.name] = false;
      return acc;
    }, {}));
    localStorage.removeItem(STORAGE_KEY);
  };

  const [result, setResult] = useState({ foods: [], nutrition: { protein: 0, fat: 0, fiber: 0 } });

  useEffect(() => {
    async function fetchResult() {
      const calculatedResult = await calculateIdealMix(
        { protein, fat, fiber },
        allFoods.filter((food) => enabledFoods[food.name]),
        maxParts
      );
      setResult(calculatedResult);
    }
    fetchResult();
  }, [protein, fat, fiber, maxParts, enabledFoods, customFoods]);

  // Update enabledFoods when customFoods change
  useEffect(() => {
    setEnabledFoods((prev) => {
      const updated = { ...prev };
      customFoods.forEach(f => {
        if (!(f.name in updated)) updated[f.name] = true;
      });
      return updated;
    });
    // eslint-disable-next-line
  }, [customFoods]);

  // Persist to localStorage on any relevant state change
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        protein,
        fat,
        fiber,
        maxParts,
        customFoods,
        enabledFoods
      })
    );
  }, [protein, fat, fiber, maxParts, customFoods, enabledFoods]);

  return (
    <div className="App">
      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
        <h1>Pigeon Food Mix Calculator</h1>
        <div className="instructions">
          <strong>Instructions:</strong> <br />
          1. Select the foods you want to include in your mix.<br />
          2. Enter your desired nutritional percentages.<br />
          3. The result shows the best mix (by <b>weight</b>) to match your target.<br />
          <br />
          <em>All percentages are by weight, not by volume.</em>
        </div>
        <h2>Desired Nutrition</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', flexDirection: 'row', gap: '12px', marginBottom: 12 }}>
          <label>
            Protein (%):
            <input type="number" value={protein} onChange={(e) => setProtein(Number(e.target.value))} min={0} max={100} />
          </label>
          <label>
            Fat (%):
            <input type="number" value={fat} onChange={(e) => setFat(Number(e.target.value))} min={0} max={100} />
          </label>
          <label>
            Fiber (%):
            <input type="number" value={fiber} onChange={(e) => setFiber(Number(e.target.value))} min={0} max={100} />
          </label>
        </div>
        <h2>Add Custom Food</h2>
        <form onSubmit={handleAddCustom} className="custom-food-form" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: 12 }}>
          <label>
            Name
            <input
              type="text"
              value={customForm.name}
              onChange={e => setCustomForm({ ...customForm, name: e.target.value })}
              required
              minLength={2}
              maxLength={32}
              pattern="[A-Za-z0-9 .,'-]+"
              title="Name should be 2-32 characters and only contain letters, numbers, spaces, and .,'-"
            />
          </label>
          <label>
            Protein (%)
            <input
              type="number"
              value={customForm.protein}
              onChange={e => setCustomForm({ ...customForm, protein: e.target.value })}
              min={0}
              max={100}
              step={0.01}
              required
              inputMode="decimal"
            />
          </label>
          <label>
            Fat (%)
            <input
              type="number"
              value={customForm.fat}
              onChange={e => setCustomForm({ ...customForm, fat: e.target.value })}
              min={0}
              max={100}
              step={0.01}
              required
              inputMode="decimal"
            />
          </label>
          <label>
            Fiber (%)
            <input
              type="number"
              value={customForm.fiber}
              onChange={e => setCustomForm({ ...customForm, fiber: e.target.value })}
              min={0}
              max={100}
              step={0.01}
              required
              inputMode="decimal"
            />
          </label>
          <button type="submit" style={{ alignSelf: 'end', padding: '8px 16px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Add</button>
        </form>
        {formError && <div style={{ color: 'red', marginBottom: 8 }}>{formError}</div>}
        <h2>Available Foods</h2>
        <button onClick={handleReset} style={{ marginBottom: 12, background: '#f5222d', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer' }}>Reset All</button>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Enable</th>
                <th>Food</th>
                <th>Protein</th>
                <th>Fat</th>
                <th>Fiber</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {allFoods.map((food) => (
                <tr key={food.name}>
                  <td data-label="Enable">
                    <input
                      type="checkbox"
                      checked={!!enabledFoods[food.name]}
                      onChange={(e) => {
                        setEnabledFoods({ ...enabledFoods, [food.name]: e.target.checked });
                      }}
                    />
                  </td>
                  <td data-label="Food">{food.name}</td>
                  <td data-label="Protein">{food.protein}</td>
                  <td data-label="Fat">{food.fat}</td>
                  <td data-label="Fiber">{food.fiber}</td>
                  <td data-label="">
                    {customFoods.some(f => f.name === food.name) && (
                      <button type="button" onClick={() => handleDeleteCustom(food.name)} style={{ background: '#ff7875', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
        <h1>Result</h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', flexDirection: 'row', gap: '12px', marginBottom: 12 }}>
          <label>
            Max Parts:
            <input type="number" value={maxParts} onChange={(e) => setMaxParts(Number(e.target.value))} min={1} />
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
        <div style={{ overflowX: 'auto' }}>
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
                  <td data-label="Food">{food}</td>
                  <td data-label="Amount">{amount} part(s)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
