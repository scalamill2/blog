---
layout: post
author: ScalaMill LLP
title: "The Shiney new microservices framework Lagom"
date: 2018-09-16 14:41:27 +0530
categories: lagom scala
tags: Lagom, scala, akka, play, microservices
---

<b>Lagom</b> is a Microservices framework built on top of Akka and Play. Lagom provides Scala as well as Java API to build microservices. Like Akka where we focus on writing business logic in Actors rather than focusing on low-level multi-threading logic, Lagom enables us to write microservices without bothering about wiring them.

###### Features of Lagom Framework
<div id = "lists">
<ol>
 	<li>    A Single command builds your supported components and microservices.</li>
 	<li>    Solves business problems instead of wiring services.</li>
 	<li>    Quickly build and hot reload project when source code changes.</li>
 	<li>    As it is built on top of Akka we get all merits of reactive applications i.e Elasticity, Resiliency and Responsiveness.</li>
</ol>
</div>
###### Lagom development environment comprises of and runs on
<div id = "lists">
<ol>
 	<li>   Cassandra</li>
 	<li>   Kafka</li>
 	<li>   A service locator</li>
 	<li>   A service gateway</li>
 	<li>   Your Lagom services</li>
</ol>
</div>
#### Below are some rules for building Microservices in Lagom
<div id = "lists">
<ol>
 	<li> Each services owns it's data</li>
 	<li> Lagom uses persistence and event sourcing for managing data</li>
 	<li> Lagom separate the service implementation from its description.</li>
</ol>
</div>
In this post, we will build a minimal Microservices for signing in and signing up a user. First of all, we will create service description interface as shown in below code.

{% highlight scala%}
package com.scalamill.signup.api

import akka.NotUsed
import com.lightbend.lagom.scaladsl.api.Service.pathCall
import com.lightbend.lagom.scaladsl.api.transport.Method
import com.lightbend.lagom.scaladsl.api.{Service, ServiceCall}
import com.scalamill.persistence.{User, UserSignUpDone}

trait SignUpLagomService extends Service {

  /**
    * Example: curl http://localhost:9000/api/signin/admin/admin
    * Example: curl -X POST   http://localhost:9000/api/signup/ -H 'content-type: application/json' -d '{"name":"admin", "password":"admin"}'
    */

  def signUp: ServiceCall[User, UserSignUpDone]
  def signIn(name: String, password: String): ServiceCall[NotUsed, Boolean]

  override final def descriptor = {
    import Service._
    named("signup").withCalls(
      restCall(Method.POST, "/api/signup/", signUp),
      pathCall("/api/signin/:name/:password", signIn _)
    ).withAutoAcl(true)
  }
}
{% endhighlight%}

Since we are dealing with sign-in and sign-up, We will need a storage to store user’s data. Lagom uses Event sourcing to store the events which are happened to the entity through its lifetime, which are replayed to bring the object into a consistent state. Thus we will define a persistent entity User to store username and password. Since persistent entity are managed by events and command, let's create them first.

{% highlight scala%}
package com.scalamill.persistence

import com.lightbend.lagom.scaladsl.persistence.PersistentEntity.ReplyType
import com.lightbend.lagom.scaladsl.persistence.{AggregateEvent, AggregateEventTag}
import play.api.libs.json.{Format, Json}

sealed trait CustomCommand

case class SignInCommand(user: User) extends CustomCommand with ReplyType[Boolean]

object SignInCommand {
  implicit val format: Format[SignInCommand] = Json.format
}

case class SignUpCommand(user: User) extends CustomCommand with ReplyType[UserSignUpDone]

object SignUpCommand {
  implicit val format: Format[SignUpCommand] = Json.format
}

case class UserSignUpDone(userId: String)

object UserSignUpDone {
  implicit val format: Format[UserSignUpDone] = Json.format
}

object SignUpEvent {
  val Tag = AggregateEventTag[SignUpEvent]
}

case class SignUpEvent(user: User, userEntityId: String) extends AggregateEvent[SignUpEvent] {
  override def aggregateTag: AggregateEventTag[SignUpEvent] = SignUpEvent.Tag
}

case class UserState(user: Option[User], timeStamp: String)
case class User(name: String, password: String)

object User {
  implicit val format: Format[User] = Json.format[User]
}

{% endhighlight %}

Now create a UserPersistenceEntity which manages the data of users.

{% highlight scala%}
package com.scalamill.persistence

import java.time.LocalDateTime

import com.lightbend.lagom.scaladsl.persistence._
import com.lightbend.lagom.scaladsl.playjson.{JsonSerializer, JsonSerializerRegistry}

import scala.collection.immutable.Seq

class UserPersistenceEntity extends PersistentEntity {

  override type Command = CustomCommand
  override type Event = SignUpEvent
  override type State = UserState

  override def initialState = UserState(None, LocalDateTime.now.toString)

  override def behavior: Behavior = Actions().onCommand[SignUpCommand, UserSignUpDone] {
    case (SignUpCommand(user), ctx, state) => 
      ctx.thenPersist(SignUpEvent(user, user.name)) {
        _ => ctx.reply(UserSignUpDone(user.name))
      }
  }.onEvent { case (SignUpEvent(user, userEntityId), state) =>
    UserState(Some(user), LocalDateTime.now.toString)
  }.onReadOnlyCommand[SignInCommand, Boolean] {
    case (SignInCommand(user), ctx, state) => ctx.reply(state.user.getOrElse(User("", "")) == user)
  }
}

object UserPersistenceSerializationRegistry extends JsonSerializerRegistry {
  override def serializers: Seq[JsonSerializer[_]] = Seq(
    JsonSerializer[UserSignUpDone],
    JsonSerializer[SignUpCommand]
  )
}
{% endhighlight %}