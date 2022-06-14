<script lang="ts">
	import produce from 'immer';
	import { handleClickZeroSection, setUpBoard, validateWin, type Cell } from './utils';

	let size = 10;
	let board: Cell[][] = setUpBoard(size);

	let gameState: 'inProgress' | 'lost' | 'won' = 'inProgress';

	const handleClick =
		([rowIdx, colIdx]: [number, number]) =>
		() => {
			if (gameState === 'inProgress') {
				const cell = board[rowIdx][colIdx];
				board = produce(board, (draft) => {
					draft[rowIdx][colIdx].clicked = true;
				});

				if (cell.mine) gameState = 'lost';

				if (cell.zeroCountSection && !cell.mine) {
					board = handleClickZeroSection(board)(cell.zeroCountSection);
				}

				if (validateWin(board)) gameState = 'won';
			}
		};

	const handleFlagClick =
		([rowIdx, colIdx]: [number, number]) =>
		(e: Event) => {
			e.preventDefault();
			if (gameState === 'inProgress') {
				board = produce(board, (draft) => {
					draft[rowIdx][colIdx].flag = true;
				});

				if (validateWin(board)) gameState = 'won';
			}
		};

	const restart = () => {
		gameState = 'inProgress';
		board = setUpBoard(size);
	};

	type CellDisplayConfig = {
		class: string | null;
		content: string | null;
	};

	const cellDisplayTypeClassMap = {
		count: (count: number) => `cell-count cell-${count}`,
		mine: 'iconoir-emoji-sad cell-loss',
		flag: 'iconoir-triangle-flag cell-flag',
		// this one is a little special, so we'll treat it differently
		zero: 'cell-zero'
	};

	const getCellUIConfig = (cell: Cell): CellDisplayConfig | undefined => {
		const defaultConfig = {
			class: null,
			content: null
		};

		return produce(defaultConfig, (draft: any) => {
			if (cell.clicked) {
				if (cell.mine) {
					draft.class = cellDisplayTypeClassMap.mine;
					return;
				}
				if (cell.count === 0) {
					draft.class = cellDisplayTypeClassMap.zero;
					return;
				}
				draft.class = cellDisplayTypeClassMap.count(cell.count);
				draft.content = cell.count;
				return;
			}

			if (cell.flag) {
				draft.class = cellDisplayTypeClassMap.flag;
				return;
			}
		});
	};
</script>

<svelte:head>
	<title>MineSweeper</title>
	<meta name="description" content="The Game Minesweeper" />

	<link
		rel="stylesheet"
		href="https://cdn.jsdelivr.net/gh/lucaburgio/iconoir@master/css/iconoir.css"
	/>
</svelte:head>

<div>
	<div class="header">MineSweeper</div>
	{#if gameState === 'lost'}
		<div class="game-over-container lost">
			<div>Sorry, you lost!</div>
			<button on:click={restart}>Replay</button>
		</div>
	{/if}

	{#if gameState === 'won'}
		<div class="game-over-container won">
			<div>You Win!</div>
			<button on:click={restart}>Replay</button>
		</div>
	{/if}

	<div class="boardWrapper">
		<div>
			{#each board as row, rowIdx}
				<div class="row">
					{#each row as cell, colIdx}
						<div
							class="cell"
							on:contextmenu={handleFlagClick([rowIdx, colIdx])}
							on:click={handleClick([rowIdx, colIdx])}
						>
							<div class={`cell-content-wrapper ${getCellUIConfig(cell)?.class}`}>
								{#if getCellUIConfig(cell)?.class}
									<div>
										{getCellUIConfig(cell)?.content || ''}
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	* {
		box-sizing: border-box;
		margin: 0;
	}

	button {
		cursor: pointer;
		background-color: orange;
		border-color: orange;
		border-radius: 6px;
		padding: 2px;
	}

	button:hover {
		border-color: orangered;
	}

	.header {
		font-size: 22px;
		font-weight: 800;
		padding: 20px;
		text-align: center;
	}

	/* GAME END DISPLAYS */

	.game-over-container {
		align-items: center;
		border-radius: 4px;
		display: flex;
		flex-direction: column;
		font-size: 22px;
		font-weight: 700;
		grid-gap: 8px;
		margin-bottom: 16px;
		padding: 8px;
	}

	.lost {
		border: 4px solid red;
		color: red;
	}

	.won {
		border: 4px solid green;
		color: green;
	}

	.boardWrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.row {
		display: flex;
	}

	.cell {
		border: 1px solid black;
		width: 4em;
		height: 4em;
		font-weight: 800;
	}

	.cell-content-wrapper {
		align-items: center;
		display: flex;
		height: 100%;
		justify-content: center;
		width: 100%;
	}

	/* CELL TYPES */

	.cell-zero {
		background-color: beige;
		height: 100%;
		width: 100%;
	}

	.cell-1 {
		background-color: lightgray;
	}

	.cell-2 {
		background-color: lightgreen;
	}

	.cell-3 {
		background-color: lightpink;
	}

	.cell-4 {
		background-color: lightsalmon;
	}
	.cell-5 {
		background-color: lightskyblue;
	}

	.cell-loss {
		background-color: lightcoral;
		height: 100%;
		width: 100%;
	}

	.cell-flag {
		background-color: lightcyan;
		height: 100%;
		width: 100%;
	}
</style>
