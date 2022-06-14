import produce from 'immer';

export type Coords = { row: number; col: number };

export type Cell = {
	count: number;
	coords: Coords;
	clicked: boolean;
	flag: boolean;
	mine: boolean;
	zeroCountSection: number | null;
};

export type Board = Cell[][];

export const getNeighbors =
	(board: Cell[][]) =>
	([rowIdx, colIdx]: [number, number]) => {
		const neighbors = [];
		for (let r = -1; r < 2; r++) {
			for (let c = -1; c < 2; c++) {
				const row = board[rowIdx + r];
				if (row) {
					const cell = row[colIdx + c];
					if (cell && !(r === 0 && c === 0)) neighbors.push(cell);
				}
			}
		}

		return neighbors;
	};

export const getGreaterNeighbors =
	(board: Cell[][]) =>
	([rowIdx, colIdx]: [number, number]) => {
		const neighbors: Cell[] = [];

		const possibleNeighbors = [
			[rowIdx - 1, colIdx - 1],
			[rowIdx - 1, colIdx],
			[rowIdx - 1, colIdx + 1],
			[rowIdx, colIdx - 1]
		];

		possibleNeighbors.forEach(([row, col]) => {
			const cell = board?.[row]?.[col];
			if (cell) neighbors.push(cell);
		});

		return neighbors;
	};

export function generateBoardStructure(size: number): number[][] {
	const boardStructure: number[][] = [];
	for (let rowIdx = 0; rowIdx < size; rowIdx++) {
		const row = [];
		for (let colIdx = 0; colIdx < size; colIdx++) {
			row.push(1);
		}

		boardStructure.push(row);
	}
	return boardStructure;
}

export const makeCell =
	(isMine: boolean) =>
	({ row, col }: Coords): Cell => {
		return {
			count: isMine ? 1 : 0,
			clicked: false,
			flag: false,
			mine: isMine,
			coords: { row, col },
			zeroCountSection: null
		};
	};

type HandlerOptions = { coords: Coords; board: Board };

type CellHandler = (cell: Cell, opts: HandlerOptions) => Cell;

/** Apply a function to each cell, returning a new board with each cell modified  */
export const forEachCell = (board: Cell[][]) => (handler: CellHandler) => {
	return produce(board, (draft) => {
		for (let rowIdx = 0; rowIdx < board.length; rowIdx++) {
			for (let colIdx = 0; colIdx < board.length; colIdx++) {
				draft[rowIdx][colIdx] = handler(board[rowIdx][colIdx], {
					board,
					coords: { row: rowIdx, col: colIdx }
				});
			}
		}
	});
};

export const countNeighborMines = (cell: Cell, { board, coords }: HandlerOptions) => {
	const neighbors = getNeighbors(board)([coords.row, coords.col]);
	const neighborMines = neighbors.filter(({ mine }) => mine).length;
	return { ...cell, count: neighborMines };
};

export const getExistingBorderingSection = (
	greaterNeighbors: Cell[],
	zeroSectionsMap: { [k: string]: number }
) => {
	const existingSections = [
		...new Set(
			greaterNeighbors
				.filter((n) => n.count === 0)
				.map((n) => zeroSectionsMap[stringifyCoords(n.coords)])
				.filter((x) => !!x)
		)
	];

	return existingSections;
};

export const getZeroSectionRectifications = (
	existingSections: number[],
	board: Board
): [number | undefined, Coords[] | null] => {
	// if a cell borders two
	if (existingSections.length > 1) {
		const [mainSection, ...mergeSection] = existingSections;

		const coordsToUpdate = mergeSection.flatMap((section) =>
			getSectionCells(board)(section).map((cell) => cell.coords)
		);

		return [mainSection, coordsToUpdate];
	}
	return [existingSections[0], null];
};

/**
 * Take a board, and group all the sections of "0 count cells"
 * This is done so that when one of these sections is clicked,
 * alls neighbor cells that are also "0 count" are triggered
 */
export const calculateZeroCountSections = (boardArg: Board) => {
	let currentZeroSection = 0;
	const zeroSectionsMap: { [k: string]: number } = {};

	let board = [...boardArg];

	/* this gets complicated and requires updates to cells outside of the current iteration
		so we're going to do a normal loop*/
	for (let rowIdx = 0; rowIdx < boardArg.length; rowIdx++) {
		for (let colIdx = 0; colIdx < boardArg.length; colIdx++) {
			const cell = board[rowIdx][colIdx];
			if (cell.count === 0) {
				const existingSections = getExistingBorderingSection(
					getGreaterNeighbors(board)([rowIdx, colIdx]),
					zeroSectionsMap
				);

				const [existingSection, cellsToUpdate] = getZeroSectionRectifications(
					existingSections,
					board
				);

				if (existingSection) {
					zeroSectionsMap[stringifyCoords(cell.coords)] = existingSection;
					board = produce(board, (draft) => {
						cellsToUpdate?.forEach((coords) => {
							draft[coords.row][coords.col].zeroCountSection = existingSection;
						});

						draft[cell.coords.row][cell.coords.col].zeroCountSection = existingSection;
					});
				} else {
					currentZeroSection += 1;
					zeroSectionsMap[stringifyCoords(cell.coords)] = currentZeroSection;
					board = produce(board, (draft) => {
						draft[rowIdx][colIdx].zeroCountSection = currentZeroSection;
					});
				}
			}
		}
	}

	return board;
};

const makeCellWithPotentialMine = (_: Cell, { coords }: HandlerOptions) =>
	makeCell(Math.random() < 0.2)(coords);

const stringifyCoords = (coords: Coords) => `${coords.row}-${coords.col}`;

export function setUpBoard(size: number) {
	const emptyBoard = generateBoardStructure(size);

	// We need to pretend emptyBoard is a real board to appease TS
	const boardWithMines: Board = forEachCell(emptyBoard as unknown as Board)(
		makeCellWithPotentialMine
	);

	const boardWithCounts = forEachCell(boardWithMines)(countNeighborMines);

	const board = calculateZeroCountSections(boardWithCounts);

	return board;
}

export function validateWin(board: Cell[][]) {
	for (let rowIdx = 0; rowIdx < board.length; rowIdx++) {
		for (let colIdx = 0; colIdx < board.length; colIdx++) {
			const cell = board[rowIdx][colIdx];
			if (cell.mine && !cell.flag) return false;
			if (!cell.mine && !cell.clicked) return false;
		}
	}

	return true;
}

export const getSectionCells = (board: Cell[][]) => (section: number) => {
	const sectionCells = [];
	for (let rowIdx = 0; rowIdx < board.length; rowIdx++) {
		for (let colIdx = 0; colIdx < board.length; colIdx++) {
			const cell = board[rowIdx][colIdx];
			if (cell.zeroCountSection === section) {
				sectionCells.push(cell);
			}
		}
	}

	return sectionCells;
};

export const handleClickZeroSection = (board: Cell[][]) => (section: number) => {
	return produce(board, (draft) => {
		const sectionCells = getSectionCells(board)(section);

		for (let i = 0; i < sectionCells.length; i++) {
			const cell = sectionCells[i];
			const neighbors = getNeighbors(board)([cell.coords.row, cell.coords.col]);

			neighbors.forEach((n) => (draft[n.coords.row][n.coords.col].clicked = true));
		}
	});
};
