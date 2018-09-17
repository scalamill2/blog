---
layout: post
title:  "Understanding Semigroup via Cats in Scala"
author : "ScalaMill LLP"
tags: "scala, akka, java, lagom, spark"
date:   2018-09-15 18:30:51 +530
categories: functional programming scala
---


Hi All, Scala now is a most widely used language for enterprises and if you are Scala Programmer then you are also using it in your daily life. Ever wondered how Scala library collections share the same algebra. We can use map, flatMap, reduceLeft, foldLeft functions for any kind of the collection if we know how a particular algebraic datatype in that collection behaves. We will understand these things via Cats.

###### What is Cats

Cats is the library written in Scala to teach you the functional design patterns in a functional programming. Cats not only provides a solid understanding of Monad, Monoid, Functor, Applicative functor in category theory but also let's you create abstractions for your datatypes .

Add Cats to your sbt project

libraryDependencies += "org.typelevel" %% "cats-core" % "1.2.0"
There are various datatype is cats and we will explore one of them in this post.

###### SemiGroup

Semigroup is a discrete mathematics concept(Wikipedia In mathematics, a semigroup is an algebraic structure consisting of a set together with an associative binary operation. ). Coming to functional programming a Semigroup over a datatype is defined as a single associative operation which takes two values of same type and return you the same datatype.

To work with cats we need to import basic imports as below.

{% highlight scala %}
import cats.Semigroup
import cats.implicits._
{% endhighlight %}

A semigroup over some datatypes is already inbuilt and they can be used as below.

{% highlight scala %}

val intSemiGroup = Semigroup[Int]
val stringSemiGroup = Semigroup[String]
val listSemiGroup = Semigroup[List[Int]]

assert(intSemiGroup.combine(1, 3) == 4)
assert(stringSemiGroup.combine("Hello", " World") == "Hello World")
assert(listSemiGroup.combine(List(1, 2, 3), List(4, 5, 6)) == List(1, 2, 3, 4, 5, 6))

{% endhighlight %}


Let's Understand Semigroup by building a Banking Transaction App.Create a TransactionType Enum to differentiate between Credit and debit transaction.

{% highlight scala %}
 object TransactionType extends Enumeration {
    type TRANSXN = Value
    val Credit = Value("Credit")
    val Debit = Value("Debit")
  }

{% endhighlight %}

Define a transaction as a case class.

{% highlight scala %}
case class Transaction(transactionType: TransactionType.TRANSXN, amount: Double)
{% endhighlight %}

Now we can define different semigroup as per the requirement. Like we need total amount credited in the person account.

{% highlight scala %}
object CombineAllCredit extends Semigroup[Transaction] {
  override def combine(a: Transaction, b: Transaction): Transaction = {
    if (a.transactionType == TransactionType.Credit && b.transactionType == TransactionType.Credit) {
      a.copy(amount = a.amount + b.amount)
    } else {
      a
    }
  }
}
{% endhighlight %}

Similarly we can find out total amount debited in the person account.

{% highlight scala %}
object CombineAllDebit extends Semigroup[Transaction] {
  override def combine(a: Transaction, b: Transaction): Transaction = {
    if (a.transactionType == TransactionType.Debit && b.transactionType == TransactionType.Debit) {
      a.copy(amount = a.amount + b.amount)
    } else {
      a
    }
  }
}
{% endhighlight %}

What if we want to find the final balance available to person account.

{% highlight scala %}
object Finalbalance extends Semigroup[Transaction] {
  override def combine(a: Transaction, b: Transaction): Transaction = {
    if (b.transactionType == TransactionType.Debit) {
      a.copy(amount = a.amount - b.amount)
    }
    else if (b.transactionType == TransactionType.Credit) {
      a.copy(amount = a.amount + b.amount)
    } else {
      a
    }
  }
}
{% endhighlight %}

Now we can provide a service to print the report.

{% highlight scala %}
object reportSevice {
  def report(transactions: Seq[Transaction]) = {
    val Transaction(_, totalCredit) = transactions.reduceLeft(CombineAllCredit.combine)
    val Transaction(_, totalDebit) = transactions.reduceLeft(CombineAllDebit.combine)
    val Transaction(_, finalbalance) = transactions.reduceLeft(Finalbalance.combine)
    s"Total Credit is $totalCredit and total debit is $totalDebit and final Balance is $finalbalance"
  }
}
{% endhighlight %}

Just create a list of transactions and see the report!

{% highlight scala %}
val transactions = List(
    Transaction(TransactionType.Credit, 200.0),
    Transaction(TransactionType.Debit, 50.0),
    Transaction(TransactionType.Credit, 300.0),
    Transaction(TransactionType.Debit, 100.0)
  )

  println(reportSevice.report(transactions))
{% endhighlight %}


Code can be accessed through [repo](https://github.com/scalamill/cats-in-practice/blob/master/src/main/scala/com/scalamill/meow/SemiGroup.scala)
