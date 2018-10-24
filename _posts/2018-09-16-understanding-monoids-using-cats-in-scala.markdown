---
layout: post
title: "Understanding monoids using Cats in Scala"
date: 2018-09-15 18:30:51 +530
tags: "scala, akka, java, lagom, spark"
categories: functional programming scala
author: ScalaMill LLP
---
In the previous post we learned about Semigroup, In this post, we will see what are Monoids and how to use them.

## What is Monoid ?

Wikipedia says In <a title="Abstract algebra" href="https://en.wikipedia.org/wiki/Abstract_algebra">abstract algebra</a>, a branch of <a title="Mathematics" href="https://en.wikipedia.org/wiki/Mathematics">mathematics</a>, a <b>monoid</b> is an <a title="Algebraic structure" href="https://en.wikipedia.org/wiki/Algebraic_structure">algebraic structure</a> with a single <a class="mw-redirect" title="Associative" href="https://en.wikipedia.org/wiki/Associative">associative</a> <a title="Binary operation" href="https://en.wikipedia.org/wiki/Binary_operation">binary operation</a> and an <a title="Identity element" href="https://en.wikipedia.org/wiki/Identity_element">identity element</a>. We saw from the previous post on Semigroup that Semigroup also has a single associative operation. So monoids are similar to Semigroup but it has an identity element and a monoid definition in Scala look like as below. Here empty method refers to identity element.

```scala

trait Monoid[A]
{
  val empty: A
  def combine(a: A, b:A): A
}
```


A Monoid has the same operation as we have with Semigroup and if we have a Semigroup available for a particular datatype we can rewrite monoid definition as below.

```scala
trait Semigroup[A] {
  def combine(x: A, y: A): A
}
trait Monoid[A] extends Semigroup[A] {
  def empty: A
}
```

In cats, we already have monoid inbuilt for some datatypes. First, add cats to your SBT project.

```scala
libraryDependencies += "org.typelevel" %% "cats-core" % "1.2.0"
```

As usual, we need to add below cats imports to work with a monoid

```scala
import cats.Monoid
import cats.implicits._
```

Monoid instance for primitive types are already available in cats and can be used as below. Monoid has an identity element by definition and if you will combine another operand with it you will get the same as you can see in below code.

```scala
val intMonoid = Monoid[Int]
val strMonoid = Monoid[String]
val listMonoid = Monoid[List[Int]]

assert(intMonoid.combine(1,3) == 4)
assert(strMonoid.combine("Hello ", "World") == "Hello World")
assert(listMonoid.combine(List(1, 2, 3), List(4, 5, 6)) == List(1, 2, 3, 4, 5, 6))

assert(intMonoid.combine(1, intMonoid.empty) == 1)
assert(strMonoid.combine("Hello World", strMonoid.empty) == "Hello World")
assert(listMonoid.combine(List(1, 2, 3), listMonoid.empty) == List(1, 2, 3))
```

In the previous post on Semigroup, we demonstrate a banking transaction App to combine the credit, debit and final balance using reduceLeft. But what will happen if we find that there are no transactions in personal account then what we will return a result? Here monoid can solve our problem as it has an identity element.

```scala
object TransactionType extends Enumeration {
  type TRANSXN = Value
  val CREDIT = Value("Credit")
  val DEBIT = Value("Debit")
  val INVALID_OR_NO_TRANSACTION = Value("InvalidOrNoTransaction")
}
```

Create a case class to represent the transaction class.

```scala
case class Transaction(transactionType: TransactionType.TRANSXN, amount: Double)
```

Now write monoids to combine all credit, debit and calculate final balance.

```scala

object CombineAllCredit extends Monoid[Transaction] {

  override def empty = Transaction(TransactionType.INVALID_OR_NO_TRANSACTION, 0)  

   override def combine(a: Transaction, b: Transaction): Transaction = {
    if(b.transactionType == TransactionType.CREDIT)
    {
      a.copy(transactionType = TransactionType.CREDIT, amount = a.amount + b.amount)
    } else {
      a
    }
  }
}

object CombineAllDebit extends Monoid[Transaction] {

  override def empty = Transaction(TransactionType.INVALID_OR_NO_TRANSACTION, 0)  

  override def combine(a: Transaction, b: Transaction): Transaction = {
    if(b.transactionType == TransactionType.DEBIT)
    {
      a.copy(transactionType = TransactionType.DEBIT, amount = a.amount + b.amount)
    } else {
      a
    }
  }
}

object Finalbalance extends Monoid[Transaction] {

  override def empty = Transaction(TransactionType.INVALID_OR_NO_TRANSACTION, 0)  

  override def combine(a: Transaction, b: Transaction): Transaction = {
    if (b.transactionType == TransactionType.DEBIT) {
      a.copy(amount = a.amount - b.amount)
    }
    else if (b.transactionType == TransactionType.CREDIT) {
      a.copy(amount = a.amount + b.amount)
    } else {
      a
    }
  }
}
```

Now we can create a function to generate the final report. In case of the no transaction if we use reduceLeft we will get a java.lang.UnsupportedOperationException: empty.reduceLeft but we will use foldleft and return an identity element as we have a monoid instance.

```scala
object reportSevice {
  def report(transactions: Seq[Transaction]) = {
    val Transaction(TransactionType.CREDIT, totalCredit) = transactions.foldLeft(CombineAllCredit.empty)(CombineAllCredit.combine)
    val Transaction(TransactionType.DEBIT, totalDebit)  =  transactions.foldLeft(CombineAllDebit.empty)(CombineAllDebit.combine)
    val Transaction(_, finalbalance) = transactions.foldLeft(Finalbalance.empty)(Finalbalance.combine)
    s"Total Credit is $totalCredit and total debit is $totalDebit and final Balance is $finalbalance"
  }
}
```

Now create some transactions and see the output.

```scala

val transactions = List(
  Transaction(TransactionType.INVALID_OR_NO_TRANSACTION, 40.0),
  Transaction(TransactionType.CREDIT, 200.0),
  Transaction(TransactionType.INVALID_OR_NO_TRANSACTION, 50.0),
  Transaction(TransactionType.DEBIT, 50.0),
  Transaction(TransactionType.CREDIT, 300.0),
  Transaction(TransactionType.DEBIT, 100.0),
  Transaction(TransactionType.INVALID_OR_NO_TRANSACTION, 25.0)
)
 println(reportSevice.report(transactions))
 ```

Please find the code through [repo](https://github.com/scalamill/cats-in-practice/blob/master/src/main/scala/com/scalamill/meow/Monoid.scala)
