enum Cell {
  none = "none",
  youth = "youth",
  maturity = "maturity",
  next = "next",
}

enum Scale {
  m = "m",
  w = "w",
  d = "d",
}

const ScaleCount = {
  [Scale.m]: 12,
  [Scale.w]: 52,
  [Scale.d]: 365, // skip leap years
};

class Question {
  value: Date;
  message = "When is your birthday? (Format YYYY-MM-DD)";
  birthDayKey = "app:birthday";

  validator = (v: any): v is string =>
    Boolean(v !== null && new Date(v).getFullYear());

  constructor() {
    this.ask();
  }

  ask(value: string | null = localStorage.getItem(this.birthDayKey)) {
    while (!this.validator(value)) {
      value = prompt(this.message);
    }

    localStorage.setItem(this.birthDayKey, value);
    return (this.value = new Date(value));
  }

  getValue(): Date {
    return this.value;
  }
}

class Timeline {
  root: HTMLDivElement;
  duration: HTMLSpanElement;
  start: Date;
  end: Date;
  scale: Scale = Scale.w;
  q: Question;

  constructor(root, duration) {
    this.root = root;
    this.duration = duration;
    this.q = new Question();
    this.start = this.q.getValue();
    this.end = this.getEndRandomDate();

    this.bindingEvents();
  }

  data() {
    const data: Cell[][] = [];
    const now = new Date();
    const startYear = this.start.getFullYear();
    const endYear = this.end.getFullYear();
    let currYear = startYear;

    while (currYear < endYear) {
      const currData: Cell[] = [];

      for (let i = 1; i <= ScaleCount[this.scale]; i++) {
        let currDate: Date;

        switch (this.scale) {
          case Scale.d:
            currDate = new Date(currYear, 0, i);
            break;
          case Scale.w:
            currDate = new Date(currYear, 0, 7 * i);
            break;
          case Scale.m:
            currDate = new Date(currYear, i - 1, now.getDate());
            break;
          default:
            throw new Error(`Not implemented scale: ${this.scale}`);
        }

        if (currDate <= this.start) {
          currData.push(Cell.none);
        } else if (currDate < now) {
          currData.push(
            currYear <= startYear + 18 ? Cell.youth : Cell.maturity
          );
        } else {
          currData.push(Cell.next);
        }
      }

      data.push(currData);
      currYear++;
    }

    return data;
  }

  render() {
    const tag = (t) => (_, content, cls?: string) =>
      `<${t} ${cls ? `class="${cls}"` : ""}>${content}</${t}>`;

    const table = tag("table");
    const tr = tag("tr");
    const td = tag("td");

    this.root.innerHTML = table`${this.data()
      .map(
        (row) =>
          tr`${row.map((col) => td`${""}${`${col} ${this.scale}`}`).join("")}`
      )
      .join("")}`;
  }

  update({ start, end, scale }: { start?: Date; end?: Date; scale?: Scale }) {
    if (start) this.start = start;
    if (end) this.end = end;
    if (scale) this.scale = scale;

    this.render();
  }

  getEndRandomDate(): Date {
    const durationValue = this.randomDuration();

    this.duration.innerHTML = String(durationValue);

    const startCopy = new Date(this.start);

    return new Date(
      startCopy.setFullYear(startCopy.getFullYear() + durationValue)
    );
  }

  randomDuration() {
    // 50..90y ~ 70y (Normal distribution is ok)
    return 50 + Math.floor(40 * Math.random());
  }

  bindingEvents() {
    (Object.keys(ScaleCount) as Scale[]).forEach((scale) =>
      document.getElementById(scale)?.addEventListener("click", () => {
        this.update({ scale });
      })
    );

    document.getElementById("birth")?.addEventListener("click", () => {
      this.update({ start: this.q.ask(null) });
    });

    document.getElementById("death")?.addEventListener("click", () => {
      this.update({ end: this.getEndRandomDate() });
    });
  }
}

new Timeline(
  document.getElementById("container"),
  document.getElementById("duration")
).render();
