//Demo App - Drag and Drop
//Manage a project with lists of projects. Active and Inactive projects with Drag and Drop between lists.
//This is a monolithic attempt.

// Order of Operations
//display to user the add project form
//Validate and Fetch the Add Project Data
//Listen for submit of form
//Creates new project (JS Object), store in an array.
//Render array to list of project list template
//Add to dom.

//validation
interface Validatable {
  value: string | number;
  required?: Boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

function validate(validatibleInput: Validatable) {
  let isValid = true;
  if (validatibleInput.required) {
    isValid = isValid && validatibleInput.value.toString().trim().length !== 0;
  }
  if (
    validatibleInput.minLength != null &&
    typeof validatibleInput.value == "string"
  ) {
    isValid =
      isValid && validatibleInput.value.length >= validatibleInput.minLength;
  }
  if (
    validatibleInput.maxLength != null &&
    typeof validatibleInput.value == "string"
  ) {
    isValid =
      isValid && validatibleInput.value.length >= validatibleInput.maxLength;
  }
  if (
    validatibleInput.min != null &&
    typeof validatibleInput.value === "number"
  ) {
    isValid = isValid && validatibleInput.value >= validatibleInput.min;
  }
  if (
    validatibleInput.max != null &&
    typeof validatibleInput.value === "number"
  ) {
    isValid = isValid && validatibleInput.value <= validatibleInput.max;
  }
  return isValid;
}

//autobind decorator
function autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  const adjDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      const boundFn = originalMethod.bind(this);
      return boundFn;
    },
  };
  return adjDescriptor;
}
//project state management
class ProjectState {
  private listeners: any[] = [];
  private projects: any[] = [];
  private static instance: ProjectState;

  private constructor() {}

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ProjectState();
    return this.instance;
  }
  addListener(listenersFn: Function) {
    this.listeners.push(listenersFn);
  }
  addProject(title: string, description: string, numOfPeople: number) {
    const newProject = {
      id: Math.random().toString(),
      title: title,
      description: description,
      people: numOfPeople,
    };
    this.projects.push(newProject);
    for (const listenersFn of this.listeners) {
      listenersFn(this.projects.slice());
    }
  }
}

const projectState = ProjectState.getInstance();
class ProjectInput {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  element: HTMLFormElement;
  titleInput: HTMLInputElement;
  descriptionInput: HTMLInputElement;
  peopleInput: HTMLInputElement;
  constructor() {
    //Gives access to template
    this.templateElement = document.getElementById(
      "project-input"
    )! as HTMLTemplateElement;
    //Holds reference to element that will render the content.
    this.hostElement = document.getElementById("app")! as HTMLDivElement;
    // Render a form right in the constructor
    //template element content property to give a reference of the content of a template.
    //second argument is a bool for deep clone or not.
    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    this.element = importedNode.firstElementChild as HTMLFormElement;
    this.element.id = "user-input";

    this.titleInput = this.element.querySelector("#title") as HTMLInputElement;
    this.descriptionInput = this.element.querySelector(
      "#description"
    ) as HTMLInputElement;
    this.peopleInput = this.element.querySelector(
      "#people"
    ) as HTMLInputElement;
    this.configure();
    this.attach();
  }
  @autobind
  private submitHandler(event: Event) {
    event.preventDefault();
    const userInput = this.gatherUserInput();
    if (Array.isArray(userInput)) {
      const [title, desc, people] = userInput;
      console.log(title, desc, people);
      projectState.addProject(title, desc, people);
      this.clearInputs();
    }
  }

  private configure() {
    this.element.addEventListener("submit", this.submitHandler);
  }

  private attach() {
    this.hostElement.insertAdjacentElement("afterbegin", this.element);
  }
  private gatherUserInput(): [string, string, number] | void {
    const enteredTitle = this.titleInput.value;
    const enteredDescription = this.descriptionInput.value;
    const enteredPeople = this.peopleInput.value;

    const titleValidatable: Validatable = {
      value: enteredTitle,
      required: true,
    };
    const descriptionValidatable: Validatable = {
      value: enteredDescription,
      required: true,
      minLength: 5,
    };
    const peopleValidatable: Validatable = {
      value: +enteredPeople,
      required: true,
      min: 1,
      max: 5,
    };

    if (
      !validate(titleValidatable) ||
      !validate(descriptionValidatable) ||
      !validate(peopleValidatable)
    ) {
      alert("invalid input please try again");
      return;
    } else {
      return [enteredTitle, enteredDescription, +enteredPeople];
    }
  }

  private clearInputs() {
    this.titleInput.value = "";
    this.descriptionInput.value = "";
    this.peopleInput.value = "";
  }
}

class ProjectList {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  element: HTMLElement;
  assignedProjects: any[] = [];

  constructor(private type: "active" | "finished") {
    //Gives access to template
    this.templateElement = document.getElementById(
      "project-list"
    )! as HTMLTemplateElement;
    //Holds reference to element that will render the content.
    this.hostElement = document.getElementById("app")! as HTMLDivElement;
    // Render a form right in the constructor
    //template element content property to give a reference of the content of a template.
    //second argument is a bool for deep clone or not.
    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    this.element = importedNode.firstElementChild as HTMLElement;
    this.element.id = `${this.type}-projects`;
    projectState.addListener((projects: any[]) => {
      this.assignedProjects = projects;
      this.renderProjects();
    });

    this.attach();
    this.renderContent();
  }
  private renderProjects() {
    const listEl = document.getElementById(
      `${this.type}-project-list`
    )! as HTMLUListElement;
    for (const prjItem of this.assignedProjects) {
      const listItem = document.createElement("li");
      listItem.textContent = prjItem.title;
      listEl.appendChild(listItem);
    }
  }
  private renderContent() {
    const listId = `${this.type}-project-list`;
    this.element.querySelector("ul")!.id = listId;
    this.element.querySelector("h2")!.textContent =
      this.type.toUpperCase() + " PROJECTS";
  }
  private attach() {
    this.hostElement.insertAdjacentElement("beforeend", this.element);
  }
}

const prjInput = new ProjectInput();
const activePrjList = new ProjectList("active");
const finishedPrjList = new ProjectList("finished");
