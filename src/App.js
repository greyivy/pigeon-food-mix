import { useState, useEffect } from 'react';
import './App.css';
import foods from './foods.js';
import { calculateIdealMix } from './calculate.js';

// Ideal nutritional percentages
const IDEAL = { protein: 14, fat: 3.75, fiber: 4.25 };
const STORAGE_KEY = 'pigeon-food-app-state-v1';

function TableCell({ value, isBold, isHeader, ariaLabel }) {
  if (isHeader) return <th scope="col">{value}</th>;
  return <td aria-label={ariaLabel} style={isBold ? { fontWeight: 'bold' } : {}}>{value}</td>;
}

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
  const [customFoods, setCustomFoods] = useState(initial?.customFoods ?? []);
  const [enabledFoods, setEnabledFoods] = useState(() => {
    if (initial?.enabledFoods) return initial.enabledFoods;
    const acc = {};
    foods.forEach(food => { acc[food.name] = false; });
    return acc;
  });
  const [search, setSearch] = useState('');
  const [addRow, setAddRow] = useState({ name: '', protein: '', fat: '', fiber: '' });
  const [addRowError, setAddRowError] = useState('');
  const allFoods = [...foods, ...customFoods];

  // Filter foods by search
  const filteredFoods = allFoods.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  // Ideal mix result
  const [result, setResult] = useState({ foods: [], nutrition: { protein: 0, fat: 0, fiber: 0 } });

  // Calculate ideal mix result
  useEffect(() => {
    async function fetchResult() {
      const calculatedResult = await calculateIdealMix(
        { protein, fat, fiber },
        allFoods.filter((food) => enabledFoods[food.name]),
        8 // hardcoded max parts
      );
      setResult(calculatedResult);
    }
    fetchResult();
  }, [protein, fat, fiber, enabledFoods, customFoods]);

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
        customFoods,
        enabledFoods
      })
    );
  }, [protein, fat, fiber, customFoods, enabledFoods]);

  // Set document title
  useEffect(() => {
    document.title = 'Pigeon Food Mix Calculator';
    // No cleanup needed
  }, []);

  // Inline add row handler
  const handleAddRow = (e) => {
    e.preventDefault();
    const { name, protein, fat, fiber } = addRow;
    if (!name.trim() || isNaN(protein) || isNaN(fat) || isNaN(fiber)) {
      setAddRowError('Please fill all fields with valid values.');
      return;
    }
    if (allFoods.some(f => f.name.toLowerCase() === name.trim().toLowerCase())) {
      setAddRowError('A food with this name already exists.');
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
    setAddRow({ name: '', protein: '', fat: '', fiber: '' });
    setAddRowError('');
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
    setCustomFoods([]);
    setAddRow({ name: '', protein: '', fat: '', fiber: '' });
    setAddRowError('');
    setEnabledFoods(foods.reduce((acc, food) => {
      acc[food.name] = false;
      return acc;
    }, {}));
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <main className="App app-main">
      <header className="pigeon-header">
        <span role="img" aria-label="pigeon" className="pigeon-emoji">🕊️</span>
        <h1 className="pigeon-title">Pigeon Food Mix Calculator</h1>
        <div className="pigeon-subtitle">
          <span role="img" aria-label="grain">🌾</span> Friendly, easy pigeon nutrition <span role="img" aria-label="seedling">🌱</span>
        </div>
      </header>
      {/* Step 1: Desired Nutrition */}
      <section className="pigeon-step" aria-labelledby="step1-heading">
        <h2 id="step1-heading">Step 1: Choose Desired Nutrition <span role="img" aria-label="target">🎯</span></h2>
        <p className="step-description" style={{ marginBottom: 14 }}>
          Enter your desired nutritional percentages for the final mix. All percentages are by weight, not by volume.
        </p>
        <div className="instructions">
          <span role="img" aria-label="info">ℹ️</span> <b>Notes on ideal percentages:</b><br />
          <b>Protein:</b> 13–15% is typical for most pigeons. Too low can cause poor growth; too high can stress kidneys.<br />
          <b>Fat:</b> 2.5–5% is a good range. Too much can cause obesity; too little can reduce energy.<br />
          <b>Fiber:</b> 2.5–6% is usually fine. Fiber is more flexible, but very high or low values can affect digestion.

          <details style={{ marginTop: 12, marginBottom: 4 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>More on nutrition recommendations</summary>
            <div style={{ marginTop: 8 }}>
              <b>Protein:</b> Some breeders use up to 18% protein for actively breeding hens, based on a <a target="_blank" rel="noopener noreferrer" href="https://www.researchgate.net/publication/248626757_Nutrition_of_the_domestic_pigeon_Columba_livia_domestica">study from the Laboratory of Animal Nutrition in Belgium</a>. This study found 18% optimal for parents rearing squabs, and other research suggests 12–18% is the general range. However, unless your pigeon is a rearing hen, 18% is likely too high—excess protein can stress internal organs.<br /><br />
              <b>Fat:</b> There’s less research on optimal fat, but the same study notes that crop milk for squabs in their first week contains 9–13% fat, which is the highest fat intake of their lives. Most commercial pigeon feeds (“all rounders” like <a target="_blank" rel="noopener noreferrer" href="https://www.chewy.com/versele-laga-classic-pigeon-food/dp/259128">VL Classic</a>, <a target="_blank" rel="noopener noreferrer" href="https://dmfnaturecenter.com/product/breeder-pigeon-mix-15/">Des Moines</a>, <a target="_blank" rel="noopener noreferrer" href="https://www.aejames.com/products/pigeon-feeds/all-round/countrywide-all-rounder/">Country Wide</a>) have 2.5–5% crude fat.<br /><br />
              <b>Fiber:</b> There aren’t many studies focused on fiber, but commercial mixes usually fall between 2.5–6%. Fiber is more forgiving, so a bit above or below is generally fine.<br /><br />
              <b>Special cases:</b> You might want higher fat for outdoor birds in harsh winters or for rehabilitating emaciated rescues. For indoor or mild-climate birds with plenty of food, the above ranges are a good baseline.<br /><br />
              <a href="https://www.pigeon.guide/diet" target="_blank" rel="noopener noreferrer"><b>More info on pigeon diet from pigeon.guide</b></a>
            </div>
          </details>
        </div>
        <table className="nutrition-table">
          <thead>
            <tr>
              <TableCell value="Nutrient" isHeader />
              <TableCell value="Target (%)" isHeader />
            </tr>
          </thead>
          <tbody>
            <tr>
              <TableCell value="Protein" ariaLabel="Protein" />
              <td>
                <input type="number" value={protein} onChange={e => setProtein(Number(e.target.value))} min={0} max={100} className="nutrition-input" aria-label="Target Protein (%)" />
              </td>
            </tr>
            <tr>
              <TableCell value="Fat" ariaLabel="Fat" />
              <td>
                <input type="number" value={fat} onChange={e => setFat(Number(e.target.value))} min={0} max={100} className="nutrition-input" aria-label="Target Fat (%)" />
              </td>
            </tr>
            <tr>
              <TableCell value="Fiber" ariaLabel="Fiber" />
              <td>
                <input type="number" value={fiber} onChange={e => setFiber(Number(e.target.value))} min={0} max={100} className="nutrition-input" aria-label="Target Fiber (%)" />
              </td>
            </tr>
          </tbody>
        </table>
      </section>
      {/* Step 2: Choose Ingredients */}
      <section className="pigeon-step">
        <h2>Step 2: Choose Ingredients <span role="img" aria-label="ingredients">🥣</span></h2>
        <p className="step-description" style={{ marginBottom: 14 }}>
          Select the foods you want to include in your mix. You can add custom foods at the bottom of the table. Use the search box to filter foods.
        </p>
        {/* Nutrient difference notifications */}
        {(() => {
          // Thresholds: protein/fat: 3% (ideal), 8% (red); fiber: 6% (ideal), 12% (red)
          const thresholds = {
            protein: { ideal: 3, red: 8 },
            fat: { ideal: 3, red: 8 },
            fiber: { ideal: 6, red: 12 }
          };
          const diffs = [
            { label: 'Protein', key: 'protein', diff: Math.abs(result.nutrition.protein - protein), value: result.nutrition.protein, target: protein },
            { label: 'Fat', key: 'fat', diff: Math.abs(result.nutrition.fat - fat), value: result.nutrition.fat, target: fat },
            { label: 'Fiber', key: 'fiber', diff: Math.abs(result.nutrition.fiber - fiber), value: result.nutrition.fiber, target: fiber }
          ];
          const notifications = diffs.map(d => {
            if (isNaN(d.diff)) return null;
            if (d.diff > thresholds[d.key].red) {
              return (
                <div className="pigeon-bubble pigeon-error" key={d.key + "-red"}>
                  <span role="img" aria-label="error" style={{ fontSize: '1.3em' }}>🛑</span>
                  <span>
                    <b>{d.label} is more than {thresholds[d.key].red}% away from your target.</b> ({d.value?.toFixed(1)}% vs {d.target}%)<br />
                    This mix is not recommended for {d.label.toLowerCase()}.
                  </span>
                </div>
              );
            }
            if (d.diff > thresholds[d.key].ideal) {
              return (
                <div className="pigeon-bubble pigeon-warning" key={d.key + "-yellow"}>
                  <span role="img" aria-label="warning" style={{ fontSize: '1.3em' }}>⚠️</span>
                  <span>
                    <b>{d.label} is more than {thresholds[d.key].ideal}% away from your target.</b> ({d.value?.toFixed(1)}% vs {d.target}%)<br />
                    Try adjusting your ingredient selection for a closer match.
                  </span>
                </div>
              );
            }
            return null;
          });
          const allInRange = diffs.every(d => d.diff <= thresholds[d.key].ideal && !isNaN(d.diff));
          if (allInRange && Object.keys(result.foods).length > 0) {
            notifications.push(
              <div className="pigeon-bubble pigeon-success" key="all-ideal">
                <span role="img" aria-label="check" style={{ fontSize: '1.3em' }}>✅</span>
                <span>
                  <b>Great job!</b> All nutrients are within their ideal range of your target. This is an <b>ideal mix</b>.
                </span>
              </div>
            );
          }
          return notifications;
        })()}
        <input
          className="food-search"
          type="text"
          placeholder="Search foods..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ minWidth: 36, width: 48, padding: 0 }}></th>
                <th>Food</th>
                <th>Protein</th>
                <th>Fat</th>
                <th>Fiber</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredFoods.map((food) => (
                <tr key={food.name}>
                  <td style={{ minWidth: 36, width: 48, padding: 0 }} data-label="Include">
                    <input
                      type="checkbox"
                      checked={!!enabledFoods[food.name]}
                      onChange={(e) => {
                        setEnabledFoods({ ...enabledFoods, [food.name]: e.target.checked });
                      }}
                    />
                  </td>
                  <td data-label="Food">{food.name}</td>
                  <td data-label="Protein">{food.protein}%</td>
                  <td data-label="Fat">{food.fat}%</td>
                  <td data-label="Fiber">{food.fiber}%</td>
                  <td data-label="">
                    {customFoods.some(f => f.name === food.name) && (
                      <button type="button" onClick={() => handleDeleteCustom(food.name)} className="button-delete">Delete</button>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="add-row">
                <td style={{ minWidth: 36, width: 48, padding: 0 }}></td>
                <td>
                  <input
                    type="text"
                    placeholder="Add new food"
                    value={addRow.name}
                    onChange={e => setAddRow({ ...addRow, name: e.target.value })}
                    minLength={2}
                    maxLength={32}
                    pattern="[A-Za-z0-9 .,'-]+"
                    title="Name should be 2-32 characters and only contain letters, numbers, spaces, and .,'-"
                    className="input-new-food"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    placeholder="Protein %"
                    value={addRow.protein}
                    onChange={e => setAddRow({ ...addRow, protein: e.target.value })}
                    min={0}
                    max={100}
                    step={0.01}
                    inputMode="decimal"
                    className="input-nutrition"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    placeholder="Fat %"
                    value={addRow.fat}
                    onChange={e => setAddRow({ ...addRow, fat: e.target.value })}
                    min={0}
                    max={100}
                    step={0.01}
                    inputMode="decimal"
                    className="input-nutrition"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    placeholder="Fiber %"
                    value={addRow.fiber}
                    onChange={e => setAddRow({ ...addRow, fiber: e.target.value })}
                    min={0}
                    max={100}
                    step={0.01}
                    inputMode="decimal"
                    className="input-nutrition"
                  />
                </td>
                <td>
                  <button type="button" onClick={handleAddRow} disabled={!addRow.name || !addRow.protein || !addRow.fat || !addRow.fiber} className="button-add">Add</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {addRowError && <div className="error-message">{addRowError}</div>}
      </section>
      {/* Step 3: Mix Food */}
      <section className="pigeon-step">
        <h2>Step 3: Mix Food <span role="img" aria-label="mix">🧑‍🍳</span></h2>
        <p className="step-description" style={{ marginBottom: 14 }}>
          The result below shows the best mix (by <b>weight</b>) to match your target. All percentages are by weight, not by volume.
        </p>
        {/* Instructions for making the mix and sourcing ingredients */}
        <div className="instructions">
          <span role="img" aria-label="instructions">📝</span> <b>How to make your mix:</b><br />
          1. <b>Source your ingredients:</b> Most pigeon foods can be found at feed stores, pet shops, or online. Look for high-quality, clean grains and seeds. Specialty items may be available from bird supply retailers.<br />
          2. <b>Weigh out each ingredient</b> according to the number of parts shown above. For example, if the mix says 3 parts corn and 1 part peas, use 3 cups of corn and 1 cup of peas (or any other unit, as long as you use the same for all).<br />
          3. <b>Mix thoroughly</b> in a large container or bucket. Store in a cool, dry place.<br />
          <span role="img" aria-label="tip">💡</span> <i>Tip: You can scale the recipe up or down as needed. Always check for freshness and quality!</i>
        </div>
        <div style={{ overflowX: 'auto', marginBottom: 18 }}>
          {Object.keys(result.foods).length === 0 ? (
            <div className="result-empty">No mix to show yet. Select or add foods to see a result.</div>
          ) : (
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
                    <td data-label="Amount">{amount} part{amount !== 1 && 's'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* Stats table moved below the mix */}
        <div style={{ marginTop: 18, marginBottom: 4 }}>
          <div className="nutrition-comparison-header">
            Nutrition Comparison
          </div>
          <table style={{ marginBottom: 12, width: '100%', maxWidth: 700, marginLeft: 0 }}>
            <thead>
              <tr>
                <th>Nutrient</th>
                <th>Desired (%)</th>
                <th>Result (%)</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Protein</td>
                <td>{protein}%</td>
                <td style={{ fontWeight: 'bold' }}>{!isNaN(result.nutrition.protein) ? result.nutrition.protein.toFixed(1) + '%' : ''}</td>
                <td>{isNaN(result.nutrition.protein - protein) || result.nutrition.protein === undefined ? '' : (Math.abs(result.nutrition.protein - protein) < 0.05 ? '0.0%' : (result.nutrition.protein - protein).toFixed(1) + '%')}</td>
              </tr>
              <tr>
                <td>Fat</td>
                <td>{fat}%</td>
                <td style={{ fontWeight: 'bold' }}>{!isNaN(result.nutrition.fat) ? result.nutrition.fat.toFixed(1) + '%' : ''}</td>
                <td>{isNaN(result.nutrition.fat - fat) || result.nutrition.fat === undefined ? '' : (Math.abs(result.nutrition.fat - fat) < 0.05 ? '0.0%' : (result.nutrition.fat - fat).toFixed(1) + '%')}</td>
              </tr>
              <tr>
                <td>Fiber</td>
                <td>{fiber}%</td>
                <td style={{ fontWeight: 'bold' }}>{!isNaN(result.nutrition.fiber) ? result.nutrition.fiber.toFixed(1) + '%' : ''}</td>
                <td>{isNaN(result.nutrition.fiber - fiber) || result.nutrition.fiber === undefined ? '' : (Math.abs(result.nutrition.fiber - fiber) < 0.05 ? '0.0%' : (result.nutrition.fiber - fiber).toFixed(1) + '%')}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <button onClick={handleReset} className="button-delete">Start Over</button>
      </section>
    </main >
  );
}

export default App;
