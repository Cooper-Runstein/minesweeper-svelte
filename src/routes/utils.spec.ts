import { mockBoard2 } from './mocks';
import {
	calculateZeroCountSections,
	generateBoardStructure,
	getExistingBorderingSection,
	getGreaterNeighbors,
	getNeighbors,
	getSectionCells,
	getZeroSectionRectifications,
	type Board
} from './utils';

const makeCell = (overrides = {}) => ({
	coords: { row: 1, col: 1 },
	mine: false,
	clicked: false,
	count: 0,
	flag: false,
	zeroCountSection: null,
	...overrides
});

const board: Board = [
	[
		makeCell({ coords: { row: 0, col: 0 } }),
		makeCell({ coords: { row: 0, col: 1 } }),
		makeCell({ coords: { row: 0, col: 3 } })
	],
	[
		makeCell({ coords: { row: 1, col: 0 } }),
		makeCell({ coords: { row: 1, col: 1 } }),
		makeCell({ coords: { row: 1, col: 3 } })
	],
	[
		makeCell({ coords: { row: 2, col: 0 } }),
		makeCell({ coords: { row: 2, col: 1 } }),
		makeCell({ coords: { row: 2, col: 3 } })
	]
];

describe('generateBoardStructure', () => {
	it('generates a board of given size with all "1"s', () => {
		const res = generateBoardStructure(5);

		expect(res).toHaveLength(5);

		res.forEach((row) => {
			expect(row).toHaveLength(5);
		});
	});
});

describe('calculateZeroCountSections', () => {
	it('works', () => {
		// Make a board with
		const board: any = [];
		for (let rowIdx = 0; rowIdx < 10; rowIdx++) {
			const row = [];
			for (let coldIdx = 0; coldIdx < 10; coldIdx++) {
				const cell = makeCell({ count: 3 });
				row.push(cell);
			}
			board.push(row);
		}

		// make section 1
		const section1Coords = [
			[0, 0],
			[0, 1],
			[0, 2],
			[1, 1],
			[2, 1]
		];

		section1Coords.forEach((coord) => {
			board[coord[0]][coord[1]].count = 0;
		});

		// make section 2
		const section2Coords = [
			[9, 0],
			[9, 1],
			[9, 2],
			[9, 3],
			[9, 4],
			[9, 5],
			[9, 6],
			[8, 1],
			[8, 2],
			[8, 3],
			[7, 2],
			[6, 1],
			[5, 0],
			[8, 7],
			[7, 6],
			[7, 5],
			[6, 7]
		];

		section2Coords.forEach((coord) => {
			board[coord[0]][coord[1]].count = 0;
		});

		const res = calculateZeroCountSections(board);

		section1Coords.forEach((coord) => {
			expect(res[coord[0]][coord[1]].zeroCountSection === 1);
		});

		section2Coords.forEach((coord) => {
			expect(res[coord[0]][coord[1]].zeroCountSection === 2);
		});
	});

	it('works with test data set', () => {
		/**
		 * Used to help translate a bug seen in the UI to test coords
		 * 0 idx in this array is cols in row 0, 1 idx are cols in row 1, etc.
		 * */
		const colsByRow = [
			[0, 1, 2, 3, 4, 5],
			[0, 4, 5],
			[4, 5, 6, 7],
			[4, 5, 6, 7]
		];
		const res = calculateZeroCountSections(mockBoard2 as Board);

		let section: number | null;
		colsByRow.forEach((cols, rowIdx) => {
			cols.forEach((colIdx, iterIdx) => {
				if (rowIdx === 0 && iterIdx === 0) {
					/* Take the first section and save it, so we can expect all joint cells to match */
					section = res[rowIdx][colIdx].zeroCountSection;
					expect(section).not.toBeUndefined();
				} else {
					if (res[rowIdx][colIdx].zeroCountSection !== section) {
						console.log(res[rowIdx][colIdx]);
					}
					expect(res[rowIdx][colIdx].zeroCountSection).toBe(section);
				}
			});
		});
	});
});

describe('getNeighbors', () => {
	it('works as expect', () => {
		const centerTileRes = getNeighbors(board)([1, 1]);
		expect(centerTileRes.length).toBe(8);

		const cornerTileRes = getNeighbors(board)([0, 0]);
		expect(cornerTileRes.length).toBe(3);

		const sideTileRes = getNeighbors(board)([0, 1]);
		expect(sideTileRes.length).toBe(5);
	});
});

describe('getGreaterNeighbors', () => {
	it('works as expect', () => {
		const centerTileRes = getGreaterNeighbors(board)([1, 1]);

		expect(centerTileRes.length).toBe(4);
	});
});

describe('getExistingBorderingSection', () => {
	it('gets existing border sections', () => {
		const neighbors = [
			makeCell({ coords: { row: 1, col: 0 } }),
			makeCell({ coords: { row: 1, col: 1 } }),
			makeCell({ coords: { row: 1, col: 2 } })
		];

		const zeroSectionsMap = {
			'1-0': 1,
			'1-1': 2,
			'1-2': 3
		};
		const res = getExistingBorderingSection(neighbors, zeroSectionsMap);
		expect(res).toContain(1);
		expect(res).toContain(2);
		expect(res).toContain(3);
	});
});

describe('zero count sections', () => {
	const board: Board = [
		[
			makeCell({ coords: { row: 0, col: 0 }, zeroCountSection: 2 }),
			makeCell({ coords: { row: 0, col: 1 } }),
			makeCell({ coords: { row: 0, col: 3 } })
		],
		[
			makeCell({ coords: { row: 1, col: 0 } }),
			makeCell({ coords: { row: 1, col: 1 }, zeroCountSection: 3 }),
			makeCell({ coords: { row: 1, col: 3 } })
		],
		[
			makeCell({ coords: { row: 2, col: 0 }, zeroCountSection: 4 }),
			makeCell({ coords: { row: 2, col: 1 }, zeroCountSection: 1 }),
			makeCell({ coords: { row: 2, col: 3 }, zeroCountSection: 1 })
		]
	];

	describe('getSectionCells', () => {
		it('gets the correct sections', () => {
			const res1 = getSectionCells(board)(1);
			expect(res1).toEqual([board[2][1], board[2][2]]);

			const res2 = getSectionCells(board)(2);
			expect(res2).toEqual([board[0][0]]);

			const res3 = getSectionCells(board)(3);
			expect(res3).toEqual([board[1][1]]);

			const res4 = getSectionCells(board)(4);
			expect(res4).toEqual([board[2][0]]);
		});
	});

	describe('getZeroSectionRectifications', () => {
		it('gets the correct section and cells if there are many', () => {
			const [resSection, resCoords] = getZeroSectionRectifications([1, 2, 3], board);

			expect(resSection).toBe(1);

			expect(resCoords).toContainEqual({ row: 0, col: 0 });
			expect(resCoords).toContainEqual({ row: 1, col: 1 });
		});
	});
});
