 export class Topic {
  topic: string;
  details: Array<String>;
}

 export class Course {
  courseName: string;
  topics: Array<Topic>;
}

declare function require(url: string);

export let courses:Array<Course> = require('./courses.json');

// export let courses = "[{ "name":"Scala", "topics":[{ "topic" : "Prmitive Types", "details": ["Null", "Nil"] }]}]";
