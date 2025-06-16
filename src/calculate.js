import GLPK from 'glpk.js';

export const PROTEIN = 'protein';
export const FAT = 'fat';
export const FIBER = 'fiber';

export async function calculateIdealMix(ideal, foods, maxParts) {
  const glpk = await GLPK();

  // GLPK problem setup (same as before)
  const problem = {
    name: 'Ideal Food Mix',
    objective: { direction: glpk.GLP_MIN, name: 'totalDeviation', vars: [] },
    subjectTo: [],
    bounds: [],
  };
  
  foods.forEach((_, i) => problem.bounds.push({ name: `x${i}`, type: glpk.GLP_LO, lb: 0 }));
  
  [PROTEIN, FAT, FIBER].forEach(nutrient => {
    problem.bounds.push({ name: `${nutrient}_pos_dev`, type: glpk.GLP_LO, lb: 0 });
    problem.bounds.push({ name: `${nutrient}_neg_dev`, type: glpk.GLP_LO, lb: 0 });
    problem.objective.vars.push({ name: `${nutrient}_pos_dev`, coef: 1 });
    problem.objective.vars.push({ name: `${nutrient}_neg_dev`, coef: 1 });
  });
  
  problem.subjectTo.push({
    name: 'sumProportions',
    vars: foods.map((_, i) => ({ name: `x${i}`, coef: 1 })),
    bnds: { type: glpk.GLP_FX, lb: 1, ub: 1 }
  });
  
  [PROTEIN, FAT, FIBER].forEach(nutrient => {
    problem.subjectTo.push({
      name: `${nutrient}_constraint`,
      vars: [
        ...foods.map((food, i) => ({ name: `x${i}`, coef: food[nutrient] })),
        { name: `${nutrient}_pos_dev`, coef: -1 },
        { name: `${nutrient}_neg_dev`, coef: 1 }
      ],
      bnds: { type: glpk.GLP_FX, lb: ideal[nutrient], ub: ideal[nutrient] }
    });
  });
  
  const result = await glpk.solve(problem, glpk.GLP_MSG_OFF);
  const proportions = foods.map((_, i) => result.result.vars[`x${i}`]);
  
  const minNonZero = Math.min(...proportions.filter(p => p > 0));
  let ratios = proportions.map(p => Math.max(1, Math.round(p / minNonZero)));
  const maxRatio = Math.max(...ratios);
  if (maxRatio > maxParts) {
    const factor = maxParts / maxRatio;
    ratios = ratios.map(r => Math.max(1, Math.round(r * factor)));
  }
  
  // Calculate final percentages
  const totalParts = ratios.reduce((a, b) => a + b, 0);
  const finalNutrition = { protein: 0, fat: 0, fiber: 0 };
  foods.forEach((food, i) => {
    finalNutrition.protein += food.protein * ratios[i];
    finalNutrition.fat += food.fat * ratios[i];
    finalNutrition.fiber += food.fiber * ratios[i];
  });
  finalNutrition.protein /= totalParts;
  finalNutrition.fat /= totalParts;
  finalNutrition.fiber /= totalParts;
  
  // Output simplified ratio and final percentages
  foods.forEach((food, i) => {
    console.log(`${ratios[i]} part(s) ${food.name}`);
  });

  return {foods: foods.reduce((obj, food, i) => {
    obj[food.name] = ratios[i];
    return obj;
  }, {}), nutrition: finalNutrition};
}