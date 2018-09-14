---
layout: post
title:  "Functional programming in scala"
author : "ScalaMill LLP"
tags: "scala, akka, java, lagom, spark"
date:   2018-09-12 19:43:29 +0530
categories: functional programming scala
---
Hello Programmers, We are living in the era of functional programming. Gone are the days when we used to model object and functions together and building the program using object-oriented technique but still we are left with the necessities of design pattern and management of code in modules when it comes to object-oriented programming. There are many functional programming languages which are coming every day but Scala is very old of them. Since Scala has come in the mainstream, many languages like Java, kotlin, Javascript are influenced by it and taken the same face as Scala has. They have functions, lambdas, closures etc. But Scala comes with a strong type system and with a lot of functional patterns inbuilt. So we will see what is functional programming and how we do it in Scala.

Unlike object-oriented Functional programming decouples object behavior from its state and functions are usable across the domains without creating objects. So functional programming is influenced by below aspects.

1. Separate object's state from its behavior
2. Use immutable objects and transform objects wherever you need.
3. Parameterize everything and talk about context.
4. Use Pure functions which produce no side effects and make reasoning easier about program execution.
5. Use higher-order polymorphism.

In order to understand functional programming first, we need to think about some domain. Let's talk about Sports domain. We have various sports like cricket, tennis, rugby, football etc and we want to build a portfolio service to display their scores. First, we will model these sports as below. We are creating a base trait Sport here to identify sports of various kinds. For example, we will deal with sports Cricket, Football tennis.

{% highlight scala %}
trait Sport

object Football extends Sport

object Tennis extends Sport

object Cricket extends Sport
{% endhighlight %}

Now we will create a base trait portfolio which will be extended by different sports portfolio as given below.

{% highlight scala %}

trait Portfolio

case class CricketPlayerPortfolio(totalRuns: Int, totalMatches: Int, centuries: Int, halfCenturies: Int) extends Portfolio

case class TennisPlayerPortfolio(totalMatches: Int, wins: Int, lost: Int) extends Portfolio

case class FootBallPlayerPortFolio(totalMatches: Int, totalGoals: Int) extends Portfolio

{% endhighlight %}


Now we are done portfolios hence we will create another trait Player which will be extended by different kind of players and a portfolio store to store player's data along with their portfolio.

{% highlight scala %}

trait Player {
  val playerId: Int
  val playerName: String
  val portfolio: Portfolio
}

case class CrickePlayer(override val playerId: Int, override val playerName: String, override val portfolio: CricketPlayerPortfolio) extends Player

case class TennisPlayer(override val playerId: Int, override val playerName: String, override val portfolio: TennisPlayerPortfolio) extends Player

case class FootballPlayer(override val playerId: Int, override val playerName: String, override val portfolio: FootBallPlayerPortFolio) extends Player

object PortfolioStore {

  val cricketPlayers = Seq(CrickePlayer(1, "Peterson", CricketPlayerPortfolio(10000, 300, 25, 50)), 
    CrickePlayer(2, "Morris", CricketPlayerPortfolio(5000, 200, 20, 30)),
    CrickePlayer(3, "Mathew", CricketPlayerPortfolio(8000, 150, 25, 45)))

  val fooballPlayers = Seq(FootballPlayer(1, "Bravo", FootBallPlayerPortFolio(300, 600)),
    FootballPlayer(2, "Dany", FootBallPlayerPortFolio(200, 300)))

  val tennisPlayers = Seq(TennisPlayer(1, "Peter", TennisPlayerPortfolio(30, 10, 20)),
    TennisPlayer(2, "Bob", TennisPlayerPortfolio(25, 20, 5)),
    TennisPlayer(3, "John", TennisPlayerPortfolio(120, 0, 10)))

  val sportsdPlayers: Map[Sport, Seq[Player]] = Map(Cricket -> cricketPlayers, Football -> fooballPlayers,
    Tennis -> tennisPlayers)
}
{% endhighlight %}

Till now we have dealt with the only state of the various object. In functional programming we separate object' state and functions apart. Let's create a service to create the portfolio of player.

{% highlight scala %}

object PortfolioBuilder {
  def buildPortfolio(player: Player) = {
    player.portfolio match {
      case CricketPlayerPortfolio(totalRuns, totalMatches, centuries, halfCenturies) =>
      s"""Number of Runs : $totalRuns 
                      Number of Matches Played: $totalMatches
                      Number of 100s $centuries
                      Number of 50's : $halfCenturies"""
      case TennisPlayerPortfolio(totalMatches, wins, lost) =>
        s"""Number of Matches Played: $totalMatches
                      Win: $wins 
                      lost: $lost"""
      case FootBallPlayerPortFolio(totalMatches, totalGoals) =>
        s"""Number of Matches Played: $totalMatches
                     Number of Goals : $totalGoals"""
    }
  }
}
{% endhighlight %}

Now we will do some functional programming over this data as given below.

{% highlight scala %}

object PortfolioApp extends App {

  def from(sport: Sport): Seq[Player] = sportsdPlayers(sport)

  def of(name: String)(seqs: Seq[Player]) = seqs.find(_.playerName == name)

  def getPlayer(name : String, sport: Sport): Option[Player] = of(name)(from(sport))

  println("############################FootBall Player Bravo##############################################")
  println(PortfolioBuilder buildPortfolio getPlayer("Bravo", Football).get)

  println("############################CricketPlayer Peterson#############################################")
  println(PortfolioBuilder buildPortfolio getPlayer("Peterson", Cricket).get)

  println("############################Tennis Player Peter#############################################")
  println(PortfolioBuilder buildPortfolio getPlayer("Peter", Tennis).get)

  //Number of Players in All domain
   val totalPlayers = sportsdPlayers.values.reduceLeft(_ ++ _).length
   println(s"Number of Players in All Sports $totalPlayers")

  //Number of total Runs scored in Cricket
  val totalRuns = sportsdPlayers(Cricket).foldLeft(0)((x, y) => y.portfolio match {
    case CricketPlayerPortfolio(totalRuny, _, _, _) => x + totalRuny
    case _ => 0
  })

  println(s"Number of total Runs scored in Cricket $totalRuns")
}
{% endhighlight %}

Hope new learners will find it useful. In next post we will see how we can inject dependencies using scala implicits. For any query mail us at contact@scalamill.com
