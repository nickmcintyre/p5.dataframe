import { Table, TableRow } from 'p5';

declare module 'p5' {
  interface Table {
    rename(from: string, to: string): void;
    slice(columns: string[]): Table;
    concat(other: Table, axis: number): Table;
    merge(other: Table, key: string): Table;
  }
}

/**
 * Changes the name of a column if it is present.
 *
 * @param {string} from the current column name
 * @param {string} to   the new column name
 */
Table.prototype.rename = function _rename(from: string, to: string): void {
  const index: number = this.columns.indexOf(from);
  if (index < 0) {
    throw new Error('The original column is not present in the table.');
  }
  this.columns[index] = to;
  this.rows.forEach((row: TableRow) => {
    // @ts-ignore
    // eslint-disable-next-line no-param-reassign
    row.obj[to] = row.obj[from];
    // @ts-ignore
    // eslint-disable-next-line no-param-reassign
    delete row.obj[from];
  });
};

/**
 * Copies a subset of the columns from an existing p5.Table.
 *
 * @param {string[]} columns the column(s) to extract from the table
 * @returns                  the new table
 */
Table.prototype.slice = function _slice(columns: string[]): Table {
  const output: Table = new Table();
  output.columns = [];
  const all: Set<string> = new Set(this.columns);
  columns.forEach((col: string) => {
    if (all.has(col)) output.columns.push(col);
  });
  this.rows.forEach((row: TableRow) => {
    const newRow: TableRow = output.addRow();
    output.columns.forEach((col: string) => {
      newRow.set(col, row.get(col));
    });
  });
  return output;
};

/**
 * Concatenates two p5.Tables along a specified axis.
 *
 * @param {p5.Table} other the other table to concatenate
 * @param {number} [axis]  the axis along which to concatenate
 * @returns                the combined table
 */
Table.prototype.concat = function _concat(
  other: Table,
  axis: number = 0,
): Table {
  if (axis === 0) {
    const output: Table = new Table();
    const columns: Set<string> = new Set();
    this.columns.forEach((col: string) => columns.add(col));
    other.columns.forEach((col: string) => columns.add(col));
    output.columns = Array.from(columns);
    this.rows.forEach((row: TableRow) => {
      const newRow: TableRow = output.addRow();
      this.columns.forEach((col: string) => newRow.set(col, row.get(col)));
    });
    other.rows.forEach((row: TableRow) => {
      const newRow: TableRow = output.addRow();
      other.columns.forEach((col) => newRow.set(col, row.get(col)));
    });
    return output;
  }
  if (axis === 1) {
    const output: Table = new Table();
    const columns: string[] = [];
    this.columns.forEach((col: string) => columns.push(col));
    other.columns.forEach((col: string) => columns.push(col));
    output.columns = columns;
    let shortTable: Table;
    let longTable: Table;
    if (this.rows.length > other.rows.length) {
      longTable = this;
      shortTable = other;
    } else {
      shortTable = this;
      longTable = other;
    }
    for (let i = 0; i < longTable.rows.length; i += 1) {
      const newRow: TableRow = output.addRow();
      const longRow: TableRow = longTable.rows[i];
      longTable.columns.forEach((col: string) => {
        newRow.set(col, longRow.get(col));
      });
      if (i < shortTable.rows.length) {
        const shortRow: TableRow = shortTable.rows[i];
        shortTable.columns.forEach((col: string) => {
          newRow.set(col, shortRow.get(col));
        });
      }
    }
    return output;
  }
  throw new Error('axis argument must be 0 or 1.');
};

/**
 * Merges two p5.Tables on a specified key.
 *
 * @param {p5.Table} other the other table to merge
 * @param {string} key     the key upon which to merge
 * @returns                the merged table
 */
Table.prototype.merge = function _merge(
  other: Table,
  key: string,
): Table {
  const inLeft: boolean = this.columns.indexOf(key) >= 0;
  const inRight: boolean = other.columns.indexOf(key) >= 0;
  if (!(inLeft && inRight)) {
    throw new Error('Both tables must have the same key.');
  }
  const output: Table = new Table();
  const leftCols: string[] = this.columns.filter((col: string) => col !== key);
  const rightCols: string[] = other.columns.filter((col: string) => col !== key);
  output.columns = [key, ...leftCols, ...rightCols];
  this.rows.forEach((leftRow: TableRow) => {
    const leftKey: string | number = leftRow.get(key);
    other.rows.forEach((rightRow: TableRow) => {
      const rightKey: string | number = rightRow.get(key);
      if (leftKey !== rightKey) return;
      const newRow: TableRow = output.addRow();
      let kval: string | number = leftRow.get(key);
      newRow.set(key, kval);
      leftCols.forEach((col: string) => {
        kval = leftRow.get(col);
        newRow.set(col, kval);
      });
      rightCols.forEach((col: string) => {
        kval = rightRow.get(col);
        newRow.set(col, kval);
      });
    });
  });
  return output;
};
